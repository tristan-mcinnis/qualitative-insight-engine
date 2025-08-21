import React from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import {
  HealthResponse,
  ConfigResponse,
  AnalysisRequest,
  AnalysisResponse,
  ApiError,
  Project,
  AnalysisSession,
  AnalysisProgress,
  UploadResult
} from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://owcstzxnpeyndgxlxxxx.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3N0enhucGV5bmRneGx4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA5MjcsImV4cCI6MjA3MTMxNjkyN30.KSQexqQYuBu5vYLooRR0h9UWfk-TEmkiImf0YUOQIDg';

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey);

// Backend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Custom error class for API errors
export class ApiServiceError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
    this.code = code;
  }
}

// Generic API request handler with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorBody: any = null;
      
      try {
        errorBody = await response.json();
        if (errorBody.error || errorBody.message) {
          errorMessage = errorBody.error || errorBody.message;
        }
      } catch {
        // If response body is not JSON, use status text
      }
      
      throw new ApiServiceError(
        errorMessage,
        response.status,
        errorBody?.code
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result.data || result; // Handle both {success, data} and direct responses
    } else {
      return {} as T;
    }
  } catch (error) {
    if (error instanceof ApiServiceError) {
      throw error;
    }
    
    // Network errors, timeout, etc.
    if (error instanceof Error) {
      throw new ApiServiceError(
        `Network error: ${error.message}`,
        0,
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiServiceError('Unknown error occurred');
  }
}

// API Service class
export class ApiService {
  /**
   * Check API health status
   */
  static async checkHealth(): Promise<HealthResponse> {
    try {
      // Test Supabase connectivity by querying projects table
      const { error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Project Management
  /**
   * Create a new project
   */
  static async createProject(
    name: string,
    description?: string,
    configuration?: any
  ): Promise<Project> {
    try {
      // For demo purposes, use an existing user_id since there's a foreign key constraint
      // In production, this should be the authenticated user's ID
      const defaultUserId = '5811893b-29f3-45c0-9bd8-42a48c0abeca';
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          status: 'created',
          configuration,
          user_id: defaultUserId,
          project_type: 'qualitative'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return project as Project;
    } catch (error) {
      throw new ApiServiceError(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get a project by ID
   */
  static async getProject(projectId: string): Promise<Project> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw new Error(`Failed to get project: ${error.message}`);
      }

      return project as Project;
    } catch (error) {
      throw new ApiServiceError(
        `Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        404
      );
    }
  }

  /**
   * Get project with analysis summary
   */
  static async getProjectSummary(projectId: string): Promise<Project & { summary: any }> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw new Error(`Failed to get project summary: ${error.message}`);
      }

      // For now, return project with empty summary
      // In production, this would aggregate analysis data
      return {
        ...project,
        summary: {
          totalVerbatims: 0,
          totalTopics: 0,
          completedAnalyses: 0
        }
      } as Project & { summary: any };
    } catch (error) {
      throw new ApiServiceError(
        `Failed to get project summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        404
      );
    }
  }

  /**
   * List all projects
   */
  static async listProjects(limit: number = 50, offset: number = 0): Promise<{
    projects: Project[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    try {
      const { data: projects, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to list projects: ${error.message}`);
      }
      
      return {
        projects: (projects || []) as Project[],
        pagination: { limit, offset, total: count || 0 }
      };
    } catch (error) {
      throw new ApiServiceError(
        `Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      return project as Project;
    } catch (error) {
      throw new ApiServiceError(
        `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      }
    } catch (error) {
      throw new ApiServiceError(
        `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  // File Upload
  /**
   * Upload discussion guide
   */
  static async uploadDiscussionGuide(
    projectId: string,
    file: File,
    content?: string
  ): Promise<UploadResult> {
    try {
      // Read file content if not provided
      const fileContent = content || await file.text();
      
      // Store discussion guide metadata in Supabase
      const { data: guide, error } = await supabase
        .from('discussion_guides')
        .insert({
          project_id: projectId,
          title: file.name,
          content: fileContent,
          file_name: file.name,
          file_size: file.size,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upload discussion guide: ${error.message}`);
      }

      return {
        id: guide.id,
        file_name: file.name,
        file_path: `/guides/${guide.id}`, // Virtual path for Supabase storage
        file_size: file.size,
        created_at: guide.created_at
      };
    } catch (error) {
      console.error('Upload discussion guide error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload transcript files
   */
  static async uploadTranscripts(
    projectId: string,
    files: File[]
  ): Promise<{ uploadedTranscripts: UploadResult[]; errors: any[] }> {
    try {
      const uploadedTranscripts: UploadResult[] = [];
      const errors: any[] = [];

      // Upload each transcript file to Supabase
      for (const file of files) {
        try {
          const content = await file.text();
          
          const { data: transcript, error } = await supabase
            .from('transcripts')
            .insert({
              project_id: projectId,
              title: file.name,
              content: content,
              file_name: file.name,
              file_size: file.size,
              status: 'uploaded',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            errors.push({ file: file.name, error: error.message });
          } else {
            uploadedTranscripts.push({
              id: transcript.id,
              file_name: file.name,
              file_path: `/transcripts/${transcript.id}`, // Virtual path for Supabase storage
              file_size: file.size,
              created_at: transcript.created_at
            });
          }
        } catch (fileError) {
          errors.push({ 
            file: file.name, 
            error: fileError instanceof Error ? fileError.message : 'Unknown error' 
          });
        }
      }

      return { uploadedTranscripts, errors };
    } catch (error) {
      console.error('Upload transcripts error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project files
   */
  static async getProjectFiles(projectId: string): Promise<{
    guide?: any;
    transcripts: any[];
  }> {
    try {
      const [guideResponse, transcriptsResponse] = await Promise.allSettled([
        supabase.from('discussion_guides').select('*').eq('project_id', projectId).single(),
        supabase.from('transcripts').select('*').eq('project_id', projectId)
      ]);

      return {
        guide: guideResponse.status === 'fulfilled' && !guideResponse.value.error 
          ? guideResponse.value.data 
          : null,
        transcripts: transcriptsResponse.status === 'fulfilled' && !transcriptsResponse.value.error
          ? transcriptsResponse.value.data || []
          : []
      };
    } catch (error) {
      console.error('Error fetching project files:', error);
      return { guide: null, transcripts: [] };
    }
  }

  /**
   * Get file download URL
   */
  static async getFileDownloadUrl(
    projectId: string,
    fileType: 'guide' | 'transcript',
    fileId: string,
    expiresIn: number = 3600
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    // For Supabase, we'll return a direct link to the content
    // In production, this would generate a signed URL from Supabase Storage
    const table = fileType === 'guide' ? 'discussion_guides' : 'transcripts';
    const baseUrl = process.env.REACT_APP_SUPABASE_URL || '';
    
    return {
      downloadUrl: `${baseUrl}/storage/v1/object/public/${table}/${fileId}`,
      expiresIn: expiresIn
    };
  }

  // Analysis
  /**
   * Start analysis for a project
   */
  static async startAnalysis(projectId: string): Promise<{
    sessionId: string;
    projectId: string;
    status: string;
    message: string;
  }> {
    try {
      // Create a new analysis session in Supabase
      const { data: session, error } = await supabase
        .from('analysis_sessions')
        .insert({
          project_id: projectId,
          status: 'created',
          progress: 0,
          current_step: 'initializing',
          settings: { mock: true, frontend_only: true }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create analysis session: ${error.message}`);
      }

      // For frontend-only deployment, simulate starting analysis
      // In a real implementation, this would trigger backend processing
      return {
        sessionId: session.id,
        projectId: projectId,
        status: 'created',
        message: 'Analysis session created successfully. Note: This is a frontend-only demo.'
      };
    } catch (error) {
      console.error('Start analysis error:', error);
      throw new Error(`Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get analysis progress
   */
  static async getAnalysisProgress(sessionId: string): Promise<AnalysisProgress> {
    try {
      const { data: session, error } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        throw new Error(`Failed to get analysis progress: ${error.message}`);
      }

      return {
        sessionId: session.id,
        projectId: session.project_id,
        status: session.status as 'created' | 'processing' | 'completed' | 'failed',
        progress: session.progress || 0,
        currentStep: session.current_step || '',
        estimatedRemaining: session.estimated_remaining_seconds
      };
    } catch (error) {
      throw new ApiServiceError(
        `Failed to get analysis progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        404
      );
    }
  }

  /**
   * Get analysis results
   */
  static async getAnalysisResults(
    sessionId: string,
    resultType?: 'themes' | 'statistics' | 'insights' | 'full_report'
  ): Promise<{
    results: any[];
    sessionInfo: {
      sessionId: string;
      projectId: string;
      completedAt: string;
    };
  }> {
    try {
      // Get session info
      const { data: session, error: sessionError } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      // Get analysis results
      const { data: results, error: resultsError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (resultsError) {
        throw new Error(`Failed to get results: ${resultsError.message}`);
      }

      // Filter by result type if specified
      const filteredResults = resultType && results
        ? results.filter((r: any) => r.result_type === resultType)
        : results || [];

      return {
        results: filteredResults,
        sessionInfo: {
          sessionId: session.id,
          projectId: session.project_id,
          completedAt: session.completed_at || new Date().toISOString()
        }
      };
    } catch (error) {
      throw new ApiServiceError(
        `Failed to get analysis results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        404
      );
    }
  }

  /**
   * Get project analysis sessions
   */
  static async getProjectSessions(projectId: string): Promise<AnalysisSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get project sessions: ${error.message}`);
      }

      return (sessions || []) as AnalysisSession[];
    } catch (error) {
      throw new ApiServiceError(
        `Failed to get project sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Retry failed analysis
   */
  static async retryAnalysis(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    message: string;
  }> {
    try {
      // Reset the session status to retry
      const { data: session, error } = await supabase
        .from('analysis_sessions')
        .update({
          status: 'created',
          progress: 0,
          current_step: 'initializing',
          error_message: null,
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to retry analysis: ${error.message}`);
      }

      return {
        sessionId: session.id,
        status: 'restarted',
        message: 'Analysis has been restarted'
      };
    } catch (error) {
      throw new ApiServiceError(
        `Failed to retry analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Delete analysis session
   */
  static async deleteAnalysisSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('analysis_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to delete analysis session: ${error.message}`);
      }
    } catch (error) {
      throw new ApiServiceError(
        `Failed to delete analysis session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use new project-based workflow instead
   */
  static async getConfig(): Promise<ConfigResponse> {
    return {
      version: '2.0.0',
      features: ['projects', 'realtime', 'supabase'],
      templates: ['standard', 'detailed', 'executive', 'custom']
    };
  }

  /**
   * @deprecated Use startAnalysis instead
   */
  static async runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    // Convert legacy request to new project-based workflow
    const project = await this.createProject(
      request.projectName || 'Legacy Analysis',
      'Migrated from legacy analysis'
    );

    // Upload files if provided
    if (request.files && request.files.length > 0) {
      const guides = request.files.filter(f => f.name.toLowerCase().includes('guide'));
      const transcripts = request.files.filter(f => !f.name.toLowerCase().includes('guide'));

      if (guides.length > 0) {
        await this.uploadDiscussionGuide(project.id, guides[0]);
      }

      if (transcripts.length > 0) {
        await this.uploadTranscripts(project.id, transcripts);
      }
    }

    // Start analysis
    const analysisResult = await this.startAnalysis(project.id);

    return {
      success: true,
      sessionId: analysisResult.sessionId,
      projectId: project.id,
      message: analysisResult.message
    };
  }

  /**
   * @deprecated Use uploadDiscussionGuide and uploadTranscripts instead
   */
  static async uploadFiles(files: File[]): Promise<{ projectDir: string }> {
    try {
      // Create a new project for uploaded files
      const project = await this.createProject(
        `Upload Session ${new Date().toISOString()}`,
        'Files uploaded for analysis'
      );

      const guides = files.filter(f => f.name.toLowerCase().includes('guide'));
      const transcripts = files.filter(f => !f.name.toLowerCase().includes('guide'));

      // For now, simulate file upload by storing metadata in Supabase
      if (guides.length > 0) {
        await this.uploadDiscussionGuide(project.id, guides[0]);
      }

      if (transcripts.length > 0) {
        await this.uploadTranscripts(project.id, transcripts);
      }

      return { projectDir: project.id };
    } catch (error) {
      console.error('Upload files error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * @deprecated Use getAnalysisProgress instead
   */
  static async getAnalysisStatus(): Promise<{
    isRunning: boolean;
    progress: number;
    currentStep: string;
    error?: string;
  }> {
    // This is a placeholder - in practice, we'd need a session ID
    return {
      isRunning: false,
      progress: 0,
      currentStep: 'No active analysis',
      error: 'Legacy method - use getAnalysisProgress with session ID'
    };
  }

  /**
   * @deprecated Analysis cannot be cancelled in new architecture
   */
  static async cancelAnalysis(): Promise<{ success: boolean }> {
    return { success: false };
  }

  /**
   * @deprecated Use getFileDownloadUrl instead
   */
  static async downloadReport(reportPath: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/download?path=${encodeURIComponent(reportPath)}`);
    
    if (!response.ok) {
      throw new ApiServiceError(
        `Failed to download report: ${response.statusText}`,
        response.status
      );
    }
    
    return response.blob();
  }
}

// Real-time functionality using Supabase
export class RealtimeService {
  /**
   * Subscribe to analysis progress updates for a project
   */
  static subscribeToAnalysisProgress(
    projectId: string,
    callback: (progress: AnalysisProgress) => void
  ) {
    const channel = supabase
      .channel(`analysis_progress_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_sessions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.new) {
            const session = payload.new as AnalysisSession;
            const progress: AnalysisProgress = {
              sessionId: session.id,
              projectId: session.project_id,
              status: session.status,
              progress: session.progress,
              currentStep: session.current_step || 'Initializing',
              estimatedRemaining: session.estimated_remaining_seconds || undefined,
              error: session.error_message || undefined
            };
            
            callback(progress);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe()
    };
  }

  /**
   * Subscribe to project updates
   */
  static subscribeToProjectUpdates(
    projectId: string,
    callback: (project: Project) => void
  ) {
    const channel = supabase
      .channel(`project_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Project);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe()
    };
  }
}

// Utility functions for handling API responses
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiServiceError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNEXPECTED_ERROR',
  };
};

// Hook for handling loading states and errors with new backend
export const useApiCall = <T>(
  apiCall: () => Promise<T>
) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, execute, reset };
};

// Hook for real-time analysis progress
export const useAnalysisProgress = (projectId: string | null) => {
  const [progress, setProgress] = React.useState<AnalysisProgress | null>(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) return;

    setIsSubscribed(true);
    const subscription = RealtimeService.subscribeToAnalysisProgress(
      projectId,
      setProgress
    );

    return () => {
      subscription.unsubscribe();
      setIsSubscribed(false);
    };
  }, [projectId]);

  return { progress, isSubscribed };
};

export default ApiService;