import os
import yaml
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class OpenAIConfig:
    model: str
    max_tokens: int
    response_tokens: int
    synthesis_response_tokens: int
    safety_buffer: int
    temperature: float
    max_concurrent_requests: int
    api_key: Optional[str] = None

@dataclass(frozen=True)
class PineconeConfig:
    api_key: Optional[str]
    environment: str
    index_name: str
    dimension: int
    metric: str

@dataclass(frozen=True)
class ProcessingConfig:
    target_input_tokens_per_chunk: int
    translation_batch_size: int
    verbatim_batch_size: int
    strategic_analysis_batch_size: int
    max_verbatims_per_topic: int

@dataclass(frozen=True)
class FileConfig:
    supported_extensions: Tuple[str, ...]
    guide_keywords: Tuple[str, ...]

@dataclass(frozen=True)
class PatternConfig:
    chinese_chars: str
    speaker: str
    timestamp: str
    simple_speaker: str

@dataclass(frozen=True)
class ExcelConfig:
    enabled: bool
    header_color: str
    max_column_width: int
    verbatim_column_width: int
    default_column_width: int

@dataclass(frozen=True)
class WordConfig:
    enabled: bool
    font_name: str
    font_size: int
    line_spacing: float
    max_topics_for_colors: int

@dataclass(frozen=True)
class RuntimeConfig:
    execute_api_calls: bool
    debug_logging: bool
    dry_run: bool

@dataclass(frozen=True)
class AppConfig:
    name: str
    version: str
    output_folder: str
    openai: OpenAIConfig
    pinecone: PineconeConfig
    processing: ProcessingConfig
    files: FileConfig
    patterns: PatternConfig
    excel: ExcelConfig
    word: WordConfig
    runtime: RuntimeConfig

class ConfigLoader:
    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent.parent / "config.yaml"
        self.config_path = Path(config_path)
        
    def _resolve_env_vars(self, value: Any) -> Any:
        if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
            env_var = value[2:-1]
            return os.getenv(env_var)
        elif isinstance(value, dict):
            return {k: self._resolve_env_vars(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._resolve_env_vars(v) for v in value]
        return value
    
    def load(self) -> AppConfig:
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        with open(self.config_path, 'r', encoding='utf-8') as f:
            raw_config = yaml.safe_load(f)
        
        # Resolve environment variables
        config = self._resolve_env_vars(raw_config)
        
        # Get API keys from environment if not in config
        if not config.get('openai', {}).get('api_key'):
            config.setdefault('openai', {})['api_key'] = os.getenv('OPENAI_API_KEY')
        
        # Create configuration objects
        return AppConfig(
            name=config['app']['name'],
            version=config['app']['version'],
            output_folder=config['app']['output_folder'],
            openai=OpenAIConfig(**config['openai']),
            pinecone=PineconeConfig(**config['pinecone']),
            processing=ProcessingConfig(**config['processing']),
            files=FileConfig(
                supported_extensions=tuple(config['files']['supported_extensions']),
                guide_keywords=tuple(config['files']['guide_keywords'])
            ),
            patterns=PatternConfig(**config['patterns']),
            excel=ExcelConfig(**config['excel']),
            word=WordConfig(**config['word']),
            runtime=RuntimeConfig(**config['runtime'])
        )
    
    def update_runtime(self, **kwargs) -> AppConfig:
        config = self.load()
        runtime_dict = config.runtime.__dict__.copy()
        runtime_dict.update(kwargs)
        
        return AppConfig(
            name=config.name,
            version=config.version,
            output_folder=config.output_folder,
            openai=config.openai,
            pinecone=config.pinecone,
            processing=config.processing,
            files=config.files,
            patterns=config.patterns,
            excel=config.excel,
            word=config.word,
            runtime=RuntimeConfig(**runtime_dict)
        )