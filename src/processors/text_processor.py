import re
from typing import Optional, Tuple
import tiktoken
from src.config.config_loader import AppConfig

class TextProcessor:
    def __init__(self, config: AppConfig):
        self.config = config
        self.chinese_pattern = re.compile(config.patterns.chinese_chars)
        self.speaker_pattern = re.compile(config.patterns.speaker)
        self.timestamp_pattern = re.compile(config.patterns.timestamp)
        self.simple_speaker_pattern = re.compile(config.patterns.simple_speaker)
        
        # Initialize tokenizer for GPT-5 Nano
        try:
            self.encoding = tiktoken.encoding_for_model("gpt-4")  # Use GPT-4 encoding as fallback
        except KeyError:
            self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def is_chinese(self, text: str) -> bool:
        return bool(self.chinese_pattern.search(text))
    
    def get_token_count(self, text: str) -> int:
        return len(self.encoding.encode(text))
    
    def extract_speaker_and_text(self, line: str) -> Optional[Tuple[str, str, Optional[str]]]:
        line = line.strip()
        if not line:
            return None
        
        # Try timestamp pattern first
        match = self.timestamp_pattern.match(line)
        if match:
            speaker = match.group(1).strip()
            timestamp = match.group(2).strip()
            text = match.group(3).strip()
            return (speaker, text, timestamp) if text else None
        
        # Try simple pattern
        match = self.simple_speaker_pattern.match(line)
        if match:
            speaker = match.group(1).strip()
            text = match.group(2).strip()
            return (speaker, text, None) if text else None
        
        return None
    
    def chunk_text(self, text: str, max_tokens: int) -> list[str]:
        """
        Split text into chunks that fit within token limits
        """
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        sentences = text.split('. ')
        
        for sentence in sentences:
            sentence_tokens = self.get_token_count(sentence)
            
            if current_tokens + sentence_tokens > max_tokens:
                if current_chunk:
                    chunks.append('. '.join(current_chunk) + '.')
                current_chunk = [sentence]
                current_tokens = sentence_tokens
            else:
                current_chunk.append(sentence)
                current_tokens += sentence_tokens
        
        if current_chunk:
            chunks.append('. '.join(current_chunk))
        
        return chunks