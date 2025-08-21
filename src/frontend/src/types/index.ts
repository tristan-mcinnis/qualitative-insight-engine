// Import database types
export * from './database';

// Core Entity Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'created' | 'uploaded' | 'configured' | 'processing' | 'completed' | 'failed';
  configuration?: ProjectConfiguration;
  created_at: string;
  updated_at: string;
}

export interface ProjectConfiguration {
  template: 'standard' | 'detailed' | 'executive' | 'custom';
  options: {
    includeWordExport?: boolean;
    includeExcelExport?: boolean;
    enableRealTimeUpdates?: boolean;
    batchSize?: number;
    confidenceThreshold?: 'Low' | 'Medium' | 'High';
  };
  estimatedTime?: number;
}

export interface AnalysisSession {
  id: string;
  project_id: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step?: string;
  estimated_remaining_seconds?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface AnalysisProgress {
  sessionId: string;
  projectId: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedRemaining?: number;
  error?: string;
}

export interface UploadResult {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

// Legacy API Types (for backward compatibility)
export interface HealthResponse {
  status: string;
  timestamp: string;
  message?: string;
  version?: string;
}

export interface ConfigResponse {
  version: string;
  features: string[];
  templates: string[];
  // Legacy fields
  openai_api_key_set?: boolean;
  default_model?: string;
  debug?: boolean;
  max_retries?: number;
  output_formats?: string[];
}

export interface AnalysisRequest {
  projectId?: string;
  projectName?: string;
  files?: File[];
  // Legacy fields
  projectDir?: string;
  skipWord?: boolean;
  skipExcel?: boolean;
  debug?: boolean;
  dryRun?: boolean;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  projectId?: string;
  results?: AnalysisResults;
  error?: string;
}

export interface AnalysisResults {
  summary: string;
  themes: Theme[];
  reports: Report[];
  files_processed: number;
  processing_time: number;
  // New fields
  totalVerbatims?: number;
  totalTopics?: number;
  totalObjectives?: number;
  completedAt?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  frequency: number;
  examples: string[];
  // New fields
  sentiment?: 'positive' | 'negative' | 'neutral';
  quotes?: string[];
}

export interface Report {
  type: 'word' | 'excel' | 'pdf';
  filename: string;
  path: string;
  size: number;
  created_at: string;
}

// Component Props Types
export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  disabled?: boolean;
  projectId?: string;
  fileType?: 'guide' | 'transcript';
}

export interface AnalysisConfigProps {
  onConfigSubmit: (config: AnalysisConfig) => void;
  isLoading?: boolean;
  disabled?: boolean;
  project?: Project;
}

export interface ProgressTrackerProps {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  sessionId?: string;
  estimatedRemaining?: number;
}

export interface ResultsViewerProps {
  results: AnalysisResults | null;
  onDownload: (reportPath: string) => void;
  sessionId?: string;
  projectId?: string;
}

export interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: Project) => void;
}

export interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onProjectCreate: () => void;
  loading?: boolean;
}

// Form and State Types
export interface AnalysisConfig {
  projectName: string;
  template: 'standard' | 'detailed' | 'executive' | 'custom';
  options: {
    includeWordExport: boolean;
    includeExcelExport: boolean;
    enableRealTimeUpdates: boolean;
    batchSize: number;
    confidenceThreshold: 'Low' | 'Medium' | 'High';
  };
  // Legacy fields
  skipWord?: boolean;
  skipExcel?: boolean;
  debug?: boolean;
  dryRun?: boolean;
}

export interface AppState {
  // New project-based workflow
  currentProject: Project | null;
  projects: Project[];
  currentSession: AnalysisSession | null;
  
  // Workflow steps
  currentStep: 'projects' | 'upload' | 'config' | 'analysis' | 'results';
  
  // File management
  uploadedFiles: {
    guide?: UploadResult;
    transcripts: UploadResult[];
  };
  
  // Analysis state
  config: AnalysisConfig;
  isAnalysisRunning: boolean;
  analysisProgress: AnalysisProgress | null;
  results: AnalysisResults | null;
  
  // UI state
  error: string | null;
  loading: boolean;
  
  // Real-time subscriptions
  subscriptions: {
    progress?: any;
    project?: any;
  };
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  loading?: boolean;
}

export interface TabProps {
  activeTab: string;
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
  className?: string;
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: string | string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Hook Types
export interface UseApiCallResult<T> {
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  execute: () => Promise<T>;
  reset: () => void;
}

export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: ApiError | null;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export interface UseAnalysisResult {
  session: AnalysisSession | null;
  progress: AnalysisProgress | null;
  results: any[] | null;
  loading: boolean;
  error: ApiError | null;
  startAnalysis: (projectId: string) => Promise<void>;
  retryAnalysis: (sessionId: string) => Promise<void>;
  subscribeToProgress: (projectId: string) => void;
  unsubscribeFromProgress: () => void;
}

// Utility Types
export type ProjectStatus = Project['status'];
export type AnalysisStatus = AnalysisSession['status'];
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';
export type ResultType = 'themes' | 'statistics' | 'insights' | 'full_report';

// File Upload Types
export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  completed: boolean;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}