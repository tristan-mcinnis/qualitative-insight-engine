// Database types for Supabase schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ProjectStatus = 'created' | 'uploaded' | 'configured' | 'processing' | 'completed' | 'failed'
export type AnalysisStatus = 'created' | 'processing' | 'completed' | 'failed'
export type ConfidenceLevel = 'Low' | 'Medium' | 'High'
export type ResultType = 'themes' | 'statistics' | 'insights' | 'full_report'

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: ProjectStatus
          configuration: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: ProjectStatus
          configuration?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: ProjectStatus
          configuration?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      discussion_guides: {
        Row: {
          id: string
          project_id: string
          file_name: string
          file_path: string
          content: string | null
          objectives: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_name: string
          file_path: string
          content?: string | null
          objectives?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_name?: string
          file_path?: string
          content?: string | null
          objectives?: Json | null
          created_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          project_id: string
          file_name: string
          file_path: string
          file_size: number
          content_type: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_name: string
          file_path: string
          file_size: number
          content_type: string
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          content_type?: string
          content?: string | null
          created_at?: string
        }
      }
      analysis_sessions: {
        Row: {
          id: string
          project_id: string
          status: AnalysisStatus
          progress: number
          current_step: string | null
          estimated_remaining_seconds: number | null
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          status?: AnalysisStatus
          progress?: number
          current_step?: string | null
          estimated_remaining_seconds?: number | null
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          status?: AnalysisStatus
          progress?: number
          current_step?: string | null
          estimated_remaining_seconds?: number | null
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
      }
      qualitative_verbatims: {
        Row: {
          id: string
          project_id: string
          transcript_id: string
          text: string
          speaker: string
          source_file: string
          line_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          transcript_id: string
          text: string
          speaker: string
          source_file: string
          line_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          transcript_id?: string
          text?: string
          speaker?: string
          source_file?: string
          line_number?: number | null
          created_at?: string
        }
      }
      question_mappings: {
        Row: {
          id: string
          project_id: string
          verbatim_id: string
          question_section: string
          question_text: string
          confidence: ConfidenceLevel
          reasoning: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          verbatim_id: string
          question_section: string
          question_text: string
          confidence: ConfidenceLevel
          reasoning?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          verbatim_id?: string
          question_section?: string
          question_text?: string
          confidence?: ConfidenceLevel
          reasoning?: string | null
          created_at?: string
        }
      }
      emergent_topics: {
        Row: {
          id: string
          project_id: string
          verbatim_id: string
          broad_topic: string
          sub_topic: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          verbatim_id: string
          broad_topic: string
          sub_topic: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          verbatim_id?: string
          broad_topic?: string
          sub_topic?: string
          created_at?: string
        }
      }
      strategic_analyses: {
        Row: {
          id: string
          project_id: string
          broad_topic: string
          sub_topic: string
          key_insights: string | null
          key_themes: string[] | null
          key_takeaways: string[] | null
          supporting_quotes: string[] | null
          verbatim_count: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          broad_topic: string
          sub_topic: string
          key_insights?: string | null
          key_themes?: string[] | null
          key_takeaways?: string[] | null
          supporting_quotes?: string[] | null
          verbatim_count: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          broad_topic?: string
          sub_topic?: string
          key_insights?: string | null
          key_themes?: string[] | null
          key_takeaways?: string[] | null
          supporting_quotes?: string[] | null
          verbatim_count?: number
          created_at?: string
        }
      }
      analysis_results: {
        Row: {
          id: string
          project_id: string
          session_id: string
          result_type: ResultType
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          session_id: string
          result_type: ResultType
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          session_id?: string
          result_type?: ResultType
          data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      analysis_dashboard: {
        Row: {
          project_id: string | null
          project_name: string | null
          total_transcripts: number | null
          total_verbatims: number | null
          total_topics: number | null
          latest_session_status: AnalysisStatus | null
          latest_session_progress: number | null
        }
      }
    }
    Functions: {
      get_project_analysis_summary: {
        Args: { project_uuid: string }
        Returns: {
          transcripts_count: number
          verbatims_count: number
          topics_count: number
          question_mappings_count: number
          latest_session_status: string
          latest_session_progress: number
        }[]
      }
      start_analysis_session: {
        Args: { project_uuid: string }
        Returns: string
      }
      update_analysis_progress: {
        Args: {
          session_uuid: string
          progress_val: number
          step_name: string
          remaining_seconds?: number
        }
        Returns: boolean
      }
      get_topic_hierarchy: {
        Args: { project_uuid: string }
        Returns: {
          broad_topic: string
          sub_topic: string
          verbatim_count: number
        }[]
      }
      get_verbatims_with_analysis: {
        Args: { project_uuid: string }
        Returns: {
          verbatim_id: string
          verbatim_text: string
          speaker: string
          source_file: string
          topics: Json
          question_mappings: Json
        }[]
      }
    }
    Enums: {
      project_status: ProjectStatus
      analysis_status: AnalysisStatus
      confidence_level: ConfidenceLevel
      result_type: ResultType
    }
  }
}

// Common types for the application
export interface ProjectConfiguration {
  template: 'standard' | 'detailed' | 'executive' | 'custom'
  options: {
    includeWordExport?: boolean
    includeExcelExport?: boolean
    enableRealTimeUpdates?: boolean
    batchSize?: number
    confidenceThreshold?: ConfidenceLevel
  }
  estimatedTime?: number
}

export interface AnalysisProgress {
  sessionId: string
  projectId: string
  status: AnalysisStatus
  progress: number
  currentStep: string
  estimatedRemaining?: number
  error?: string
}

export interface VerbatimData {
  text: string
  speaker: string
  sourceFile: string
  lineNumber?: number
}

export interface TopicAssignment {
  broadTopic: string
  subTopic: string
}

export interface QuestionMapping {
  questionSection: string
  questionText: string
  confidence: ConfidenceLevel
  reasoning?: string
}

export interface StrategicAnalysisResult {
  broadTopic: string
  subTopic: string
  keyInsights?: string
  keyThemes?: string[]
  keyTakeaways?: string[]
  supportingQuotes?: string[]
  verbatimCount: number
}