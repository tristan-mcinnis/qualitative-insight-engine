import { supabase } from '../config/supabase';
import { Database, AnalysisStatus, AnalysisProgress } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Row'];
type AnalysisSessionInsert = Database['public']['Tables']['analysis_sessions']['Insert'];
type AnalysisResult = Database['public']['Tables']['analysis_results']['Row'];
type AnalysisResultInsert = Database['public']['Tables']['analysis_results']['Insert'];

export interface AnalysisSteps {
  PREPROCESSING: string;
  EXTRACTING_VERBATIMS: string;
  MAPPING_QUESTIONS: string;
  EMERGENT_TOPICS: string;
  STRATEGIC_ANALYSIS: string;
  GENERATING_REPORTS: string;
}

export const ANALYSIS_STEPS: AnalysisSteps = {
  PREPROCESSING: 'Preprocessing files',
  EXTRACTING_VERBATIMS: 'Extracting verbatims',
  MAPPING_QUESTIONS: 'Mapping to questions',
  EMERGENT_TOPICS: 'Analyzing emergent topics',
  STRATEGIC_ANALYSIS: 'Strategic analysis',
  GENERATING_REPORTS: 'Generating reports'
};

export class AnalysisService {

  async createAnalysisSession(projectId: string): Promise<AnalysisSession> {
    // Use the database function to create a new session
    const { data: sessionId, error: functionError } = await supabase
      .rpc('start_analysis_session', { project_uuid: projectId });

    if (functionError) {
      throw new Error(`Failed to create analysis session: ${functionError.message}`);
    }

    // Get the created session
    const { data: session, error: getError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (getError) {
      throw new Error(`Failed to get created session: ${getError.message}`);
    }

    return session;
  }

  async getAnalysisSession(sessionId: string): Promise<AnalysisSession | null> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get analysis session: ${error.message}`);
    }

    return data;
  }

  async updateAnalysisProgress(
    sessionId: string,
    progress: number,
    currentStep: string,
    estimatedRemaining?: number
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('update_analysis_progress', {
        session_uuid: sessionId,
        progress_val: progress,
        step_name: currentStep,
        remaining_seconds: estimatedRemaining
      });

    if (error) {
      throw new Error(`Failed to update analysis progress: ${error.message}`);
    }

    return data;
  }

  async completeAnalysisSession(sessionId: string): Promise<AnalysisSession> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .update({
        status: 'completed',
        progress: 100,
        current_step: 'Completed',
        completed_at: new Date().toISOString(),
        estimated_remaining_seconds: 0
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete analysis session: ${error.message}`);
    }

    return data;
  }

  async failAnalysisSession(sessionId: string, errorMessage: string): Promise<AnalysisSession> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark analysis session as failed: ${error.message}`);
    }

    return data;
  }

  async saveAnalysisResult(
    projectId: string,
    sessionId: string,
    resultType: 'themes' | 'statistics' | 'insights' | 'full_report',
    data: any
  ): Promise<AnalysisResult> {
    const resultRecord: AnalysisResultInsert = {
      id: uuidv4(),
      project_id: projectId,
      session_id: sessionId,
      result_type: resultType,
      data: data,
      created_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('analysis_results')
      .insert(resultRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save analysis result: ${error.message}`);
    }

    return result;
  }

  async getAnalysisResults(
    sessionId: string,
    resultType?: 'themes' | 'statistics' | 'insights' | 'full_report'
  ): Promise<AnalysisResult[]> {
    let query = supabase
      .from('analysis_results')
      .select('*')
      .eq('session_id', sessionId);

    if (resultType) {
      query = query.eq('result_type', resultType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get analysis results: ${error.message}`);
    }

    return data || [];
  }

  async getProjectAnalysisSessions(projectId: string): Promise<AnalysisSession[]> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get project analysis sessions: ${error.message}`);
    }

    return data || [];
  }

  async getLatestAnalysisSession(projectId: string): Promise<AnalysisSession | null> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get latest analysis session: ${error.message}`);
    }

    return data;
  }

  formatProgressUpdate(session: AnalysisSession): AnalysisProgress {
    return {
      sessionId: session.id,
      projectId: session.project_id,
      status: session.status,
      progress: session.progress,
      currentStep: session.current_step || 'Initializing',
      estimatedRemaining: session.estimated_remaining_seconds || undefined,
      error: session.error_message || undefined
    };
  }

  calculateEstimatedTime(progress: number, baseEstimate: number = 300): number {
    if (progress === 0) return baseEstimate;
    if (progress >= 100) return 0;
    
    const remainingPercent = (100 - progress) / 100;
    return Math.max(0, Math.round(baseEstimate * remainingPercent));
  }

  getStepProgress(step: keyof AnalysisSteps): number {
    const stepMap = {
      PREPROCESSING: 10,
      EXTRACTING_VERBATIMS: 25,
      MAPPING_QUESTIONS: 50,
      EMERGENT_TOPICS: 70,
      STRATEGIC_ANALYSIS: 85,
      GENERATING_REPORTS: 95
    };
    
    return stepMap[step] || 0;
  }

  async deleteAnalysisSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('analysis_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to delete analysis session: ${error.message}`);
    }

    return true;
  }

  async getAnalysisSummary(projectId: string) {
    // Get comprehensive analysis summary using database function
    const { data: summary, error } = await supabase
      .rpc('get_project_analysis_summary', { project_uuid: projectId });

    if (error) {
      throw new Error(`Failed to get analysis summary: ${error.message}`);
    }

    return summary?.[0] || {
      transcripts_count: 0,
      verbatims_count: 0,
      topics_count: 0,
      question_mappings_count: 0,
      latest_session_status: null,
      latest_session_progress: 0
    };
  }
}