// Database service using Supabase client
import { createClient } from '@supabase/supabase-js';
import type { 
  Database, 
  Project, 
  AnalysisSession, 
  QualitativeVerbatim,
  QuestionMapping,
  EmergentTopic,
  StrategicAnalysis,
  AnalysisResult,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateAnalysisSessionRequest,
  UpdateAnalysisSessionRequest,
  PipelineResults
} from '../types/database';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Project operations
export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(project: CreateProjectRequest): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get project analysis summary using custom function
  async getAnalysisSummary(projectId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_project_analysis_summary', { project_uuid: projectId });
    
    if (error) throw error;
    return data;
  }
};

// Analysis session operations
export const analysisSessionService = {
  async getByProjectId(projectId: string): Promise<AnalysisSession[]> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<AnalysisSession | null> {
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async start(projectId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('start_analysis_session', { project_uuid: projectId });
    
    if (error) throw error;
    return data;
  },

  async updateProgress(
    sessionId: string, 
    progress: number, 
    step?: string, 
    estimatedSeconds?: number
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('update_analysis_progress', {
        session_uuid: sessionId,
        new_progress: progress,
        new_step: step,
        estimated_seconds: estimatedSeconds
      });
    
    if (error) throw error;
    return data;
  },

  async markComplete(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('analysis_sessions')
      .update({ 
        status: 'completed', 
        progress: 100, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  async markFailed(sessionId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('analysis_sessions')
      .update({ 
        status: 'failed', 
        error_message: errorMessage 
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  }
};

// Verbatim operations
export const verbatimService = {
  async getByProjectId(projectId: string, limit = 100, offset = 0): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_verbatims_with_analysis', {
        project_uuid: projectId,
        limit_count: limit,
        offset_count: offset
      });
    
    if (error) throw error;
    return data;
  },

  async create(verbatim: any): Promise<QualitativeVerbatim> {
    const { data, error } = await supabase
      .from('qualitative_verbatims')
      .insert([verbatim])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async bulkCreate(verbatims: any[]): Promise<QualitativeVerbatim[]> {
    const { data, error } = await supabase
      .from('qualitative_verbatims')
      .insert(verbatims)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Question mapping operations
export const questionMappingService = {
  async getByProjectId(projectId: string): Promise<QuestionMapping[]> {
    const { data, error } = await supabase
      .from('question_mappings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async bulkCreate(mappings: any[]): Promise<QuestionMapping[]> {
    const { data, error } = await supabase
      .from('question_mappings')
      .insert(mappings)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Emergent topic operations
export const emergentTopicService = {
  async getByProjectId(projectId: string): Promise<EmergentTopic[]> {
    const { data, error } = await supabase
      .from('emergent_topics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getTopicHierarchy(projectId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_topic_hierarchy', { project_uuid: projectId });
    
    if (error) throw error;
    return data;
  },

  async bulkCreate(topics: any[]): Promise<EmergentTopic[]> {
    const { data, error } = await supabase
      .from('emergent_topics')
      .insert(topics)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Strategic analysis operations
export const strategicAnalysisService = {
  async getByProjectId(projectId: string): Promise<StrategicAnalysis[]> {
    const { data, error } = await supabase
      .from('strategic_analyses')
      .select('*')
      .eq('project_id', projectId)
      .order('verbatim_count', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async bulkCreate(analyses: any[]): Promise<StrategicAnalysis[]> {
    const { data, error } = await supabase
      .from('strategic_analyses')
      .insert(analyses)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

// Analysis results operations
export const analysisResultService = {
  async getBySessionId(sessionId: string): Promise<AnalysisResult[]> {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(result: any): Promise<AnalysisResult> {
    const { data, error } = await supabase
      .from('analysis_results')
      .insert([result])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Dashboard operations
export const dashboardService = {
  async getProjectDashboard(): Promise<any[]> {
    const { data, error } = await supabase
      .from('analysis_dashboard')
      .select('*')
      .order('project_created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// Real-time subscriptions
export const subscriptionService = {
  subscribeToAnalysisProgress(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`analysis_session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();
  },

  subscribeToProjectChanges(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_sessions',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .subscribe();
  }
};

// Auth helpers
export const authService = {
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    return await supabase.auth.getUser();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};