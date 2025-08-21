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
    return apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description, configuration }),
    });
  }

  /**
   * Get a project by ID
   */
  static async getProject(projectId: string): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`, {
      method: 'GET',
    });
  }

  /**
   * Get project with analysis summary
   */
  static async getProjectSummary(projectId: string): Promise<Project & { summary: any }> {
    return apiRequest<Project & { summary: any }>(`/projects/${projectId}/summary`, {
      method: 'GET',
    });
  }

  /**
   * List all projects
   */
  static async listProjects(limit: number = 50, offset: number = 0): Promise<{
    projects: Project[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const response = await apiRequest<{
      data: Project[];
      pagination: { limit: number; offset: number; total: number };
    }>(`/projects?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    
    return {
      projects: response.data || response as any,
      pagination: response.pagination || { limit, offset, total: 0 }
    };
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project> {
    return apiRequest<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string): Promise<void> {
    await apiRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
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
    const formData = new FormData();
    formData.append('file', file);
    if (content) {
      formData.append('content', content);
    }

    return apiRequest<UploadResult>(`/projects/${projectId}/upload/guide`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it
    });
  }

  /**
   * Upload transcript files
   */
  static async uploadTranscripts(
    projectId: string,
    files: File[]
  ): Promise<{ uploadedTranscripts: UploadResult[]; errors: any[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiRequest<{
      data: UploadResult[];
      errors?: any[];
    }>(`/projects/${projectId}/upload/transcripts`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it
    });

    return {
      uploadedTranscripts: response.data || response as any,
      errors: response.errors || []
    };
  }

  /**
   * Get project files
   */
  static async getProjectFiles(projectId: string): Promise<{
    guide?: any;
    transcripts: any[];
  }> {
    const [guideResponse, transcriptsResponse] = await Promise.allSettled([
      apiRequest(`/projects/${projectId}/files/guide`, { method: 'GET' }),
      apiRequest(`/projects/${projectId}/files/transcripts`, { method: 'GET' })
    ]);

    return {
      guide: guideResponse.status === 'fulfilled' ? guideResponse.value : null,
      transcripts: transcriptsResponse.status === 'fulfilled' 
        ? (transcriptsResponse.value as any)?.data || [] 
        : []
    };
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
    return apiRequest<{ downloadUrl: string; expiresIn: number }>(
      `/projects/${projectId}/files/${fileType}/${fileId}/download?expiresIn=${expiresIn}`,
      { method: 'GET' }
    );
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
    return apiRequest<AnalysisProgress>(`/analysis/progress/${sessionId}`, {
      method: 'GET',
    });
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
    const url = resultType 
      ? `/analysis/results/${sessionId}?resultType=${resultType}`
      : `/analysis/results/${sessionId}`;
    
    const response = await apiRequest<{
      data: any[];
      sessionInfo: {
        sessionId: string;
        projectId: string;
        completedAt: string;
      };
    }>(url, { method: 'GET' });

    return {
      results: response.data || response as any,
      sessionInfo: response.sessionInfo
    };
  }

  /**
   * Get project analysis sessions
   */
  static async getProjectSessions(projectId: string): Promise<AnalysisSession[]> {
    const response = await apiRequest<{ data: AnalysisSession[] }>(
      `/analysis/sessions/${projectId}`,
      { method: 'GET' }
    );
    
    return response.data || response as any;
  }

  /**
   * Retry failed analysis
   */
  static async retryAnalysis(sessionId: string): Promise<{
    sessionId: string;
    status: string;
    message: string;
  }> {
    return apiRequest<{
      sessionId: string;
      status: string;
      message: string;
    }>(`/analysis/retry/${sessionId}`, {
      method: 'POST',
    });
  }

  /**
   * Delete analysis session
   */
  static async deleteAnalysisSession(sessionId: string): Promise<void> {
    await apiRequest(`/analysis/sessions/${sessionId}`, {
      method: 'DELETE',
    });
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