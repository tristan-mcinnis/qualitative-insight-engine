// API Types
export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ConfigResponse {
  openai_api_key_set: boolean;
  default_model: string;
  debug: boolean;
  max_retries: number;
  output_formats: string[];
}

export interface AnalysisRequest {
  projectDir: string;
  skipWord?: boolean;
  skipExcel?: boolean;
  debug?: boolean;
  dryRun?: boolean;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  results?: AnalysisResults;
  error?: string;
}

export interface AnalysisResults {
  summary: string;
  themes: Theme[];
  reports: Report[];
  files_processed: number;
  processing_time: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  frequency: number;
  examples: string[];
}

export interface Report {
  type: 'word' | 'excel';
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
}

export interface AnalysisConfigProps {
  onConfigSubmit: (config: AnalysisConfig) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface ProgressTrackerProps {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}

export interface ResultsViewerProps {
  results: AnalysisResults | null;
  onDownload: (reportPath: string) => void;
}

// Form and State Types
export interface AnalysisConfig {
  projectName: string;
  skipWord: boolean;
  skipExcel: boolean;
  debug: boolean;
  dryRun: boolean;
}

export interface AppState {
  currentStep: 'upload' | 'config' | 'analysis' | 'results';
  uploadedFiles: File[];
  config: AnalysisConfig;
  isAnalysisRunning: boolean;
  analysisProgress: number;
  analysisStep: string;
  results: AnalysisResults | null;
  error: string | null;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabProps {
  activeTab: string;
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}