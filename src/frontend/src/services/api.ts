import {
  HealthResponse,
  ConfigResponse,
  AnalysisRequest,
  AnalysisResponse,
  ApiError
} from '../types';

// Base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
      return await response.json();
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
    return apiRequest<HealthResponse>('/health', {
      method: 'GET',
    });
  }

  /**
   * Get application configuration
   */
  static async getConfig(): Promise<ConfigResponse> {
    return apiRequest<ConfigResponse>('/config', {
      method: 'GET',
    });
  }

  /**
   * Run analysis with provided configuration
   */
  static async runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    return apiRequest<AnalysisResponse>('/run', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Upload files to the server
   * Returns the project directory path where files were uploaded
   */
  static async uploadFiles(files: File[]): Promise<{ projectDir: string }> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    return apiRequest<{ projectDir: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type header to let browser set boundary for FormData
      },
    });
  }

  /**
   * Download a generated report file
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

  /**
   * Cancel running analysis (if supported by backend)
   */
  static async cancelAnalysis(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/cancel', {
      method: 'POST',
    });
  }

  /**
   * Get analysis status (for polling during long-running operations)
   */
  static async getAnalysisStatus(): Promise<{
    isRunning: boolean;
    progress: number;
    currentStep: string;
    error?: string;
  }> {
    return apiRequest('/status', {
      method: 'GET',
    });
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

// Hook for handling loading states and errors
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

  return { loading, error, data, execute };
};

// React import for the hook
import React from 'react';

export default ApiService;