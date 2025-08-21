// Generated TypeScript types for Qualitative Research Analysis Pipeline Database Schema

// Enum types
export type ProjectStatus = 'created' | 'uploaded' | 'configured' | 'processing' | 'completed' | 'failed';
export type AnalysisStatus = 'created' | 'processing' | 'completed' | 'failed';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';
export type ResultType = 'themes' | 'statistics' | 'insights' | 'full_report';

// Base table interfaces
export interface Project {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  project_type?: string;
  status: string; // Uses existing project status values
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiscussionGuide {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  research_topic: string;
  target_audience?: string;
  guide_content: Record<string, any>;
  estimated_duration?: number;
  difficulty_level?: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  job_id?: string;
  file_id?: string;
  user_id?: string;
  organization_id?: string;
  project_id?: string;
  provider: string;
  transcript_text: string;
  language: string;
  duration?: number;
  speaker_count?: number;
  utterances: Record<string, any>[];
  metadata: Record<string, any>;
  original_filename?: string;
  speakers: Record<string, any>[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisSession {
  id: string;
  project_id: string;
  status: AnalysisStatus;
  progress: number;
  current_step?: string;
  estimated_remaining_seconds?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface QualitativeVerbatim {
  id: string;
  job_id?: string;
  file_id?: string;
  project_id?: string;
  transcript_id?: string;
  speaker: string;
  text: string;
  timestamp?: string;
  mapped_question?: string;
  mapped_objective?: string;
  assigned_topics?: string[];
  confidence_score?: number;
  original_language?: string;
  translated_text?: string;
  sequence_number: number;
  source_file?: string;
  line_number?: number;
  created_at: string;
}

export interface QuestionMapping {
  id: string;
  project_id: string;
  verbatim_id: string;
  question_section: string;
  question_text: string;
  confidence: ConfidenceLevel;
  reasoning?: string;
  created_at: string;
}

export interface EmergentTopic {
  id: string;
  project_id: string;
  verbatim_id: string;
  broad_topic: string;
  sub_topic: string;
  created_at: string;
}

export interface StrategicAnalysis {
  id: string;
  project_id: string;
  broad_topic: string;
  sub_topic: string;
  key_insights?: string;
  key_themes: string[];
  key_takeaways: string[];
  supporting_quotes: string[];
  verbatim_count: number;
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  project_id: string;
  session_id: string;
  result_type: ResultType;
  data: Record<string, any>;
  created_at: string;
}

// Relationship interfaces for joins
export interface VerbatimWithMappings extends QualitativeVerbatim {
  question_mappings: QuestionMapping[];
  emergent_topics: EmergentTopic[];
}

export interface ProjectWithAnalysis extends Project {
  analysis_sessions: AnalysisSession[];
  discussion_guides: DiscussionGuide[];
  transcripts: Transcript[];
  verbatims: QualitativeVerbatim[];
  question_mappings: QuestionMapping[];
  emergent_topics: EmergentTopic[];
  strategic_analyses: StrategicAnalysis[];
  analysis_results: AnalysisResult[];
}

export interface AnalysisSessionWithResults extends AnalysisSession {
  project: Project;
  analysis_results: AnalysisResult[];
}

// API request/response interfaces
export interface CreateProjectRequest {
  name: string;
  description?: string;
  configuration?: Record<string, any>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  configuration?: Record<string, any>;
}

export interface CreateAnalysisSessionRequest {
  project_id: string;
}

export interface UpdateAnalysisSessionRequest {
  status?: AnalysisStatus;
  progress?: number;
  current_step?: string;
  estimated_remaining_seconds?: number;
  error_message?: string;
  completed_at?: string;
}

export interface CreateVerbatimRequest {
  project_id: string;
  transcript_id?: string;
  speaker: string;
  text: string;
  source_file?: string;
  line_number?: number;
  timestamp?: string;
}

export interface CreateQuestionMappingRequest {
  project_id: string;
  verbatim_id: string;
  question_section: string;
  question_text: string;
  confidence: ConfidenceLevel;
  reasoning?: string;
}

export interface CreateEmergentTopicRequest {
  project_id: string;
  verbatim_id: string;
  broad_topic: string;
  sub_topic: string;
}

export interface CreateStrategicAnalysisRequest {
  project_id: string;
  broad_topic: string;
  sub_topic: string;
  key_insights?: string;
  key_themes?: string[];
  key_takeaways?: string[];
  supporting_quotes?: string[];
  verbatim_count?: number;
}

export interface CreateAnalysisResultRequest {
  project_id: string;
  session_id: string;
  result_type: ResultType;
  data: Record<string, any>;
}

// Analysis pipeline specific interfaces
export interface PipelineConfiguration {
  skip_word?: boolean;
  skip_excel?: boolean;
  debug?: boolean;
  dry_run?: boolean;
  verbatim_batch_size?: number;
  strategic_analysis_batch_size?: number;
  target_input_tokens_per_chunk?: number;
}

export interface AnalysisProgress {
  session_id: string;
  progress: number;
  current_step: string;
  estimated_remaining_seconds?: number;
  error_message?: string;
}

export interface PipelineResults {
  session_id: string;
  project_id: string;
  total_verbatims: number;
  total_mappings: number;
  total_topics: number;
  total_strategic_analyses: number;
  processing_time_seconds: number;
  status: AnalysisStatus;
  files_generated: string[];
}

// Export all for convenience
export type Database = {
  projects: Project;
  discussion_guides: DiscussionGuide;
  transcripts: Transcript;
  analysis_sessions: AnalysisSession;
  qualitative_verbatims: QualitativeVerbatim;
  question_mappings: QuestionMapping;
  emergent_topics: EmergentTopic;
  strategic_analyses: StrategicAnalysis;
  analysis_results: AnalysisResult;
};