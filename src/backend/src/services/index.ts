// Export all services for easy importing
export { ProjectsService } from './projects.service';
export { UploadsService } from './uploads.service';
export { AnalysisService } from './analysis.service';
export { RealtimeService } from './realtime.service';
export { AIProcessorService } from './ai-processor.service';

// Service instances (singletons)
let projectsService: ProjectsService | null = null;
let uploadsService: UploadsService | null = null;
let analysisService: AnalysisService | null = null;
let realtimeService: RealtimeService | null = null;
let aiProcessorService: AIProcessorService | null = null;

// Singleton factory functions
export function getProjectsService(): ProjectsService {
  if (!projectsService) {
    projectsService = new ProjectsService();
  }
  return projectsService;
}

export function getUploadsService(): UploadsService {
  if (!uploadsService) {
    uploadsService = new UploadsService();
  }
  return uploadsService;
}

export function getAnalysisService(): AnalysisService {
  if (!analysisService) {
    analysisService = new AnalysisService();
  }
  return analysisService;
}

export function getRealtimeService(): RealtimeService {
  if (!realtimeService) {
    realtimeService = new RealtimeService();
  }
  return realtimeService;
}

export function getAIProcessorService(): AIProcessorService {
  if (!aiProcessorService) {
    aiProcessorService = new AIProcessorService();
  }
  return aiProcessorService;
}