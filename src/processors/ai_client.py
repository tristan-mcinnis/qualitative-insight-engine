import asyncio
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
import pinecone
from pinecone import Pinecone, ServerlessSpec
from src.config.config_loader import AppConfig
from src.utils.logger import Logger
from src.processors.text_processor import TextProcessor

class DummyResponse:
    def __init__(self):
        self.choices = [DummyChoice()]

class DummyChoice:
    def __init__(self):
        self.message = DummyMessage()

class DummyMessage:
    def __init__(self):
        self.content = """[DRY-RUN MODE] This is a simulated response."""

class AIClient:
    def __init__(self, config: AppConfig, logger: Logger):
        self.config = config
        self.logger = logger
        self.text_processor = TextProcessor(config)
        
        # Initialize OpenAI client with GPT-5 Nano format
        if config.openai.api_key:
            self.client = OpenAI(api_key=config.openai.api_key)
        else:
            raise ValueError("OPENAI_API_KEY not configured")
        
        # Initialize Pinecone for vector storage
        self.pinecone_client = None
        self.pinecone_index = None
        if config.pinecone.api_key:
            self._init_pinecone()
        
        self.semaphore = asyncio.Semaphore(config.openai.max_concurrent_requests)
        self.translation_cache = {}
        self.cost_tracker = 0.0
    
    def _init_pinecone(self):
        try:
            self.pinecone_client = Pinecone(api_key=self.config.pinecone.api_key)
            
            # Check if index exists, create if not
            index_name = self.config.pinecone.index_name
            if index_name not in self.pinecone_client.list_indexes().names():
                self.logger.info(f"Creating Pinecone index: {index_name}")
                self.pinecone_client.create_index(
                    name=index_name,
                    dimension=self.config.pinecone.dimension,
                    metric=self.config.pinecone.metric,
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=self.config.pinecone.environment
                    )
                )
            
            self.pinecone_index = self.pinecone_client.Index(index_name)
            self.logger.info("Pinecone initialized successfully")
            
        except Exception as e:
            self.logger.warning(f"Pinecone initialization failed: {e}")
            self.logger.warning("Vector storage features will be disabled")
    
    async def call_gpt5_nano(self, messages: List[Dict[str, Any]], 
                            response_format: Optional[Dict] = None,
                            max_tokens: Optional[int] = None) -> Any:
        """
        Call GPT-5 Nano using the new API format from CLAUDE.md
        """
        if not self.config.runtime.execute_api_calls:
            self.logger.debug("[DRY-RUN] Skipping actual API call")
            return DummyResponse()
        
        # Convert messages to GPT-5 Nano format
        formatted_messages = []
        
        # Add developer message if needed
        system_messages = [m for m in messages if m.get('role') == 'system']
        if system_messages:
            formatted_messages.append({
                "role": "developer",
                "content": [{
                    "type": "input_text",
                    "text": system_messages[0]['content']
                }]
            })
        
        # Add user messages
        user_messages = [m for m in messages if m.get('role') == 'user']
        for msg in user_messages:
            formatted_messages.append({
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": msg['content']
                }]
            })
        
        try:
            async with self.semaphore:
                response = self.client.responses.create(
                    model="gpt-5-nano",
                    input=formatted_messages,
                    text={
                        "format": {"type": "json"} if response_format else {"type": "text"},
                        "verbosity": "medium"
                    },
                    reasoning={"effort": "medium"},
                    tools=[],
                    store=True
                )
                return response
                
        except Exception as e:
            self.logger.error(f"GPT-5 Nano API call failed: {e}")
            raise
    
    async def store_embedding(self, text: str, metadata: Dict[str, Any]) -> Optional[str]:
        """
        Store text embedding in Pinecone for later retrieval
        """
        if not self.pinecone_index:
            return None
        
        try:
            # Generate embedding using OpenAI
            embedding_response = self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            
            embedding = embedding_response.data[0].embedding
            
            # Generate unique ID
            import uuid
            vector_id = str(uuid.uuid4())
            
            # Store in Pinecone
            self.pinecone_index.upsert(
                vectors=[(vector_id, embedding, metadata)]
            )
            
            return vector_id
            
        except Exception as e:
            self.logger.error(f"Failed to store embedding: {e}")
            return None
    
    async def search_similar(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Search for similar verbatims using vector similarity
        """
        if not self.pinecone_index:
            return []
        
        try:
            # Generate query embedding
            embedding_response = self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=query
            )
            
            query_embedding = embedding_response.data[0].embedding
            
            # Search in Pinecone
            results = self.pinecone_index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            return [match.metadata for match in results.matches]
            
        except Exception as e:
            self.logger.error(f"Vector search failed: {e}")
            return []
    
    async def translate_text(self, text: str) -> str:
        if text in self.translation_cache:
            return self.translation_cache[text]
        
        if not self.text_processor.is_chinese(text):
            self.translation_cache[text] = text
            return text
        
        messages = [{
            "role": "user",
            "content": f"Translate the following Chinese text to English: {text}"
        }]
        
        try:
            response = await self.call_gpt5_nano(messages)
            translation = response.choices[0].message.content.strip()
            self.translation_cache[text] = translation
            return translation
            
        except Exception as e:
            self.logger.error(f"Translation error: {e}")
            return text
    
    async def extract_guide_objectives(self, guide_text: str) -> Dict[str, Any]:
        prompt = f"""
        Extract every single question from this discussion guide into a structured JSON format.
        Return: {{"objectives": [{{"section": "...", "question": "..."}}]}}
        
        Discussion guide:
        {guide_text}
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = await self.call_gpt5_nano(messages, response_format={"type": "json"})
        
        return json.loads(response.choices[0].message.content)
    
    async def map_verbatim_to_question(self, verbatim: Dict[str, Any], 
                                      objectives: List[Dict[str, str]]) -> Dict[str, Any]:
        objectives_str = "\n".join([
            f"ID-{i+1}: [{obj['section']}] {obj['question']}" 
            for i, obj in enumerate(objectives)
        ])
        
        prompt = f"""Map this verbatim to the most relevant question.
        Return: {{"best_fit_question_id": "ID-X", "confidence": "High/Medium/Low", "reasoning": "..."}}
        
        Questions:
        {objectives_str}
        
        Verbatim:
        Speaker: {verbatim['speaker']}
        Text: "{verbatim['text']}"
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = await self.call_gpt5_nano(messages, response_format={"type": "json"})
        
        # Store verbatim embedding for future retrieval
        if self.pinecone_index:
            await self.store_embedding(
                verbatim['text'],
                {
                    "speaker": verbatim['speaker'],
                    "source_file": verbatim.get('source_file', ''),
                    "type": "verbatim"
                }
            )
        
        return json.loads(response.choices[0].message.content)
    
    async def analyze_emergent_topics(self, verbatims: List[Dict[str, Any]]) -> Dict[str, Any]:
        prompt = f"""Analyze these verbatims and identify hierarchical topics.
        
        Return JSON format:
        {{
          "identified_topics_hierarchy": [
            {{
              "broad_topic_name": "...",
              "broad_topic_description": "...",
              "sub_topics": [{{"sub_topic_name": "...", "sub_topic_description": "..."}}]
            }}
          ],
          "verbatims_with_topics": [
            {{
              "text": "...",
              "speaker": "...",
              "source_file": "...",
              "assigned_topics": [{{"broad_topic": "...", "sub_topic": "..."}}]
            }}
          ]
        }}
        
        Verbatims:
        {json.dumps(verbatims, ensure_ascii=False, indent=2)}
        """
        
        messages = [
            {"role": "system", "content": "You are a qualitative research analyst."},
            {"role": "user", "content": prompt}
        ]
        
        response = await self.call_gpt5_nano(
            messages, 
            response_format={"type": "json"},
            max_tokens=self.config.openai.response_tokens
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def analyze_topic_strategically(self, broad_topic: str, sub_topic: str, 
                                        verbatims: List[Dict[str, Any]]) -> Dict[str, Any]:
        verbatim_list = "\n".join([
            f'{i+1}. (Speaker: {v["speaker"]}) "{v["text"]}"'
            for i, v in enumerate(verbatims[:self.config.processing.max_verbatims_per_topic])
        ])
        
        prompt = f"""Analyze these verbatims for the topic '{sub_topic}' under '{broad_topic}'.
        
        Return JSON format:
        {{
          "key_themes": ["2-4 critical themes"],
          "key_insights": "Analysis paragraph",
          "key_takeaways": ["2-3 strategic recommendations"],
          "supporting_quotes": ["2-3 quotes with speakers"]
        }}
        
        Verbatims:
        {verbatim_list}
        """
        
        messages = [{"role": "user", "content": prompt}]
        response = await self.call_gpt5_nano(
            messages,
            response_format={"type": "json"},
            max_tokens=self.config.openai.response_tokens
        )
        
        return json.loads(response.choices[0].message.content)