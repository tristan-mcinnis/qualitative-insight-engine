#!/usr/bin/env python3
"""
Qualitative Research Analysis Pipeline - Main Entry Point
Refactored with proper separation of concerns and GPT-5 Nano integration
"""

import sys
import asyncio
import argparse
from pathlib import Path
from datetime import datetime
import json
import pandas as pd
import collections

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import ConfigLoader, AppConfig
from src.utils import Logger
from src.processors import AIClient, TextProcessor, FileReader, VerbatimExtractor
from src.exporters.excel_exporter import ExcelFormatter
from src.exporters.word_exporter import WordExporter

class QualitativeAnalysisPipeline:
    def __init__(self, project_directory: str, config: AppConfig = None):
        # Load configuration
        if config is None:
            config_loader = ConfigLoader()
            config = config_loader.load()
        self.config = config
        
        # Setup logging
        self.logger = Logger(debug=config.runtime.debug_logging)
        self.logger.info(f"Initializing pipeline v{config.version}")
        
        # Setup directories
        self.project_dir = Path(project_directory).resolve()
        if not self.project_dir.exists():
            raise ValueError(f"Directory does not exist: {self.project_dir}")
        
        self.output_dir = self.project_dir / config.output_folder
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.text_processor = TextProcessor(config)
        self.verbatim_extractor = VerbatimExtractor(self.text_processor, self.logger)
        self.ai_client = AIClient(config, self.logger)
        self.excel_formatter = ExcelFormatter(config)
        self.word_exporter = WordExporter(config, self.logger)
        
        self._setup_output_paths()
    
    def _setup_output_paths(self):
        self.guide_objectives_file = self.output_dir / "guide_objectives.json"
        self.emergent_topics_file = self.output_dir / "emergent_topics_report.xlsx"
        self.question_mapping_file = self.output_dir / "question_mapping_clean.xlsx"
        self.strategic_analysis_file = self.output_dir / "strategic_analysis.xlsx"
        self.master_report_file = self.output_dir / "master_strategic_report.xlsx"
        self.master_pivot_file = self.output_dir / "master_pivot_ready.xlsx"
        self.word_analysis_report = self.output_dir / "analysis_report.docx"
        self.word_executive_summary = self.output_dir / "executive_summary.docx"
        self.word_qda_workbook = self.output_dir / "manual_coding_workbook.docx"
    
    def find_discussion_guide(self) -> Path:
        for ext in self.config.files.supported_extensions:
            pattern = f"*{ext}"
            for file in self.project_dir.glob(pattern):
                filename_lower = file.name.lower()
                if any(keyword in filename_lower for keyword in self.config.files.guide_keywords):
                    return file
        
        raise FileNotFoundError("No discussion guide found in project directory")
    
    def find_transcript_files(self) -> list[Path]:
        transcripts = []
        
        try:
            guide_file = self.find_discussion_guide()
        except FileNotFoundError:
            guide_file = None
            self.logger.warning("No discussion guide found")
        
        for ext in self.config.files.supported_extensions:
            pattern = f"*{ext}"
            for file in self.project_dir.glob(pattern):
                if (file != guide_file and 
                    not file.name.startswith("~") and 
                    not file.name.startswith(".")):
                    transcripts.append(file)
        
        return transcripts
    
    async def extract_guide_objectives(self) -> dict:
        self.logger.info("Step 1: Extracting objectives from discussion guide...")
        
        try:
            guide_path = self.find_discussion_guide()
            self.logger.info(f"Found discussion guide: {guide_path.name}")
            
            guide_text = FileReader.read_document(guide_path)
            result = await self.ai_client.extract_guide_objectives(guide_text)
            
            with open(self.guide_objectives_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            objectives_count = len(result.get('objectives', []))
            self.logger.info(f"Extracted {objectives_count} objectives")
            
            return result
            
        except FileNotFoundError as e:
            self.logger.error(f"Discussion guide not found: {e}")
            return {"objectives": []}
    
    def extract_all_verbatims(self) -> list[dict]:
        self.logger.info("Step 2: Extracting verbatims from transcripts...")
        
        all_verbatims = []
        transcript_files = self.find_transcript_files()
        
        if not transcript_files:
            self.logger.warning("No transcript files found!")
            return []
        
        for file in transcript_files:
            self.logger.info(f"Extracting from: {file.name}")
            try:
                verbatims = self.verbatim_extractor.extract_from_file(file)
                all_verbatims.extend(verbatims)
                self.logger.info(f"  - Extracted {len(verbatims)} verbatims")
            except Exception as e:
                self.logger.error(f"Error extracting from {file.name}: {e}")
        
        self.logger.info(f"Total verbatims extracted: {len(all_verbatims)}")
        return all_verbatims
    
    async def perform_question_mapping(self, verbatims: list[dict], objectives: list[dict]) -> pd.DataFrame:
        self.logger.info("Step 3a: Mapping verbatims to discussion guide questions...")
        
        if not objectives:
            self.logger.warning("No objectives available for mapping")
            return pd.DataFrame()
        
        batch_size = self.config.processing.verbatim_batch_size
        chunks = [verbatims[i:i+batch_size] for i in range(0, len(verbatims), batch_size)]
        
        all_mappings = []
        
        for i, chunk in enumerate(chunks):
            self.logger.info(f"Processing batch {i+1}/{len(chunks)}...")
            
            tasks = [
                self.ai_client.map_verbatim_to_question(verbatim, objectives)
                for verbatim in chunk
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for verbatim, result in zip(chunk, results):
                if isinstance(result, Exception):
                    self.logger.error(f"Error mapping verbatim: {result}")
                    continue
                
                self._process_mapping_result(verbatim, result, objectives, all_mappings)
        
        return pd.DataFrame(all_mappings)
    
    def _process_mapping_result(self, verbatim: dict, result: dict, 
                               objectives: list[dict], all_mappings: list[dict]):
        question_id = result.get("best_fit_question_id", "ID-0")
        confidence = result.get("confidence", "Low")
        
        if question_id != "ID-0" and confidence != "Low":
            try:
                idx = int(question_id.split("-")[1]) - 1
                if 0 <= idx < len(objectives):
                    obj = objectives[idx]
                    all_mappings.append({
                        "Section": obj['section'],
                        "Question": obj['question'],
                        "Verbatim": verbatim['text'],
                        "Speaker": verbatim['speaker'],
                        "Confidence": confidence,
                        "Reasoning": result.get('reasoning', ''),
                        "Source File": verbatim['source_file']
                    })
            except (ValueError, IndexError):
                self.logger.error(f"Invalid question ID format: {question_id}")
    
    async def perform_emergent_topic_analysis(self, verbatims: list[dict]) -> dict:
        self.logger.info("Step 3b: Performing emergent topic analysis...")
        
        if not verbatims:
            return {"identified_topics_hierarchy": [], "verbatims_with_topics": []}
        
        chunks = self._chunk_verbatims(verbatims)
        
        tasks = [
            self.ai_client.analyze_emergent_topics(chunk)
            for chunk in chunks
        ]
        
        chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = [r for r in chunk_results if not isinstance(r, Exception)]
        
        if not valid_results:
            raise Exception("No valid results from emergent topic analysis")
        
        # For now, return first valid result
        # TODO: Implement proper synthesis of multiple results
        return valid_results[0]
    
    def _chunk_verbatims(self, verbatims: list[dict]) -> list[list[dict]]:
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        base_tokens = 1000
        max_verbatim_tokens = (
            self.config.openai.max_tokens - 
            base_tokens - 
            self.config.openai.response_tokens - 
            self.config.openai.safety_buffer
        )
        
        for verbatim in verbatims:
            verbatim_json = json.dumps(verbatim, ensure_ascii=False)
            verbatim_tokens = self.text_processor.get_token_count(verbatim_json)
            
            if (current_tokens + verbatim_tokens > 
                min(self.config.processing.target_input_tokens_per_chunk, max_verbatim_tokens)):
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = [verbatim]
                current_tokens = verbatim_tokens
            else:
                current_chunk.append(verbatim)
                current_tokens += verbatim_tokens
        
        if current_chunk:
            chunks.append(current_chunk)
        
        self.logger.info(f"Created {len(chunks)} chunks from {len(verbatims)} verbatims")
        return chunks
    
    async def perform_strategic_analysis(self, emergent_report: dict) -> pd.DataFrame:
        self.logger.info("Step 4: Performing strategic analysis...")
        
        topic_verbatims = collections.defaultdict(list)
        
        for verbatim in emergent_report.get('verbatims_with_topics', []):
            for topic in verbatim.get('assigned_topics', []):
                key = f"{topic['broad_topic']}|{topic['sub_topic']}"
                topic_verbatims[key].append({
                    'text': verbatim['text'],
                    'speaker': verbatim['speaker']
                })
        
        analyses = []
        topics = list(topic_verbatims.items())
        batch_size = self.config.processing.strategic_analysis_batch_size
        
        for i in range(0, len(topics), batch_size):
            batch = topics[i:i+batch_size]
            tasks = []
            
            for topic_key, verbatims in batch:
                broad_topic, sub_topic = topic_key.split('|', 1)
                tasks.append(
                    self.ai_client.analyze_topic_strategically(
                        broad_topic, sub_topic, verbatims
                    )
                )
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for (topic_key, topic_verbatims_list), result in zip(batch, results):
                if isinstance(result, Exception):
                    self.logger.error(f"Error analyzing topic: {result}")
                    continue
                
                broad_topic, sub_topic = topic_key.split('|', 1)
                self._process_strategic_result(
                    broad_topic, sub_topic, result, 
                    len(topic_verbatims_list), analyses
                )
        
        return pd.DataFrame(analyses)
    
    def _process_strategic_result(self, broad_topic: str, sub_topic: str,
                                 result: dict, verbatim_count: int,
                                 analyses: list[dict]):
        if not isinstance(result, dict):
            return
        
        themes = result.get('key_themes', [])
        takeaways = result.get('key_takeaways', [])
        quotes = result.get('supporting_quotes', [])
        
        base_row = {
            "Broad Topic": broad_topic,
            "Sub-Topic": sub_topic,
            "Key Insights": result.get('key_insights', ''),
            "Verbatim Count": verbatim_count
        }
        
        analyses.append({
            **base_row,
            "Theme": themes[0] if themes else '',
            "Takeaway": takeaways[0] if takeaways else '',
            "Supporting Quote": quotes[0] if quotes else ''
        })
        
        max_items = max(len(themes), len(takeaways), len(quotes))
        for j in range(1, max_items):
            analyses.append({
                **base_row,
                "Theme": themes[j] if j < len(themes) else '',
                "Takeaway": takeaways[j] if j < len(takeaways) else '',
                "Supporting Quote": quotes[j] if j < len(quotes) else ''
            })
    
    async def run_pipeline(self):
        try:
            start_time = datetime.now()
            self.logger.info("Starting qualitative analysis pipeline...")
            self.logger.info(f"Project directory: {self.project_dir}")
            
            # Extract objectives
            objectives_data = await self.extract_guide_objectives()
            objectives = objectives_data.get('objectives', [])
            
            # Extract verbatims
            all_verbatims = self.extract_all_verbatims()
            
            if not all_verbatims:
                self.logger.error("No verbatims extracted!")
                return
            
            # Parallel analysis
            self.logger.info("Step 3: Running parallel analysis...")
            question_task = self.perform_question_mapping(all_verbatims, objectives)
            emergent_task = self.perform_emergent_topic_analysis(all_verbatims)
            
            question_df, emergent_report = await asyncio.gather(
                question_task, emergent_task
            )
            
            # Save intermediate results
            if self.config.excel.enabled and not question_df.empty:
                self.excel_formatter.save_dataframe(
                    question_df, self.question_mapping_file, "Question Mapping"
                )
            
            # Process emergent topics
            emergent_df = self._process_emergent_data(emergent_report)
            if self.config.excel.enabled and not emergent_df.empty:
                self.excel_formatter.save_dataframe(
                    emergent_df, self.emergent_topics_file, "Emergent Topics"
                )
            
            # Strategic analysis
            strategic_df = pd.DataFrame()
            if not emergent_df.empty:
                strategic_df = await self.perform_strategic_analysis(emergent_report)
                if self.config.excel.enabled and not strategic_df.empty:
                    self.excel_formatter.save_dataframe(
                        strategic_df, self.strategic_analysis_file, "Strategic Analysis"
                    )
            
            # Log completion
            elapsed_time = datetime.now() - start_time
            self.logger.info(f"Pipeline completed in {elapsed_time}")
            self.logger.info(f"Output files saved to: {self.output_dir}")
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {str(e)}")
            raise
    
    def _process_emergent_data(self, emergent_report: dict) -> pd.DataFrame:
        emergent_data = []
        for verbatim in emergent_report.get('verbatims_with_topics', []):
            for topic in verbatim.get('assigned_topics', []):
                emergent_data.append({
                    "Broad Topic": topic['broad_topic'],
                    "Sub-Topic": topic['sub_topic'],
                    "Verbatim": verbatim['text'],
                    "Speaker": verbatim['speaker'],
                    "Source File": verbatim['source_file']
                })
        return pd.DataFrame(emergent_data)

async def main():
    parser = argparse.ArgumentParser(
        description="Qualitative Research Analysis Pipeline v3.0"
    )
    parser.add_argument(
        "project_directory",
        help="Path to project directory containing transcripts and discussion guide"
    )
    parser.add_argument("--skip-word", action="store_true", help="Skip Word export")
    parser.add_argument("--skip-excel", action="store_true", help="Skip Excel export")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument("--dry-run", action="store_true", help="Dry run without API calls")
    parser.add_argument("--config", help="Path to custom config file")
    
    args = parser.parse_args()
    
    # Load and customize configuration
    config_loader = ConfigLoader(args.config if args.config else None)
    config = config_loader.load()
    
    # Apply CLI overrides
    if args.skip_word:
        config = config_loader.update_runtime(word_enabled=False)
    if args.skip_excel:
        config = config_loader.update_runtime(excel_enabled=False)
    if args.debug:
        config = config_loader.update_runtime(debug_logging=True)
    if args.dry_run:
        config = config_loader.update_runtime(execute_api_calls=False)
    
    # Run pipeline
    try:
        pipeline = QualitativeAnalysisPipeline(args.project_directory, config)
        await pipeline.run_pipeline()
        print("\n✅ Analysis completed successfully!")
    except Exception as e:
        print(f"\n❌ Pipeline failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if sys.platform.startswith('win'):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())