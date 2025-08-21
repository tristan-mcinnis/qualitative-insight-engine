import { AnalysisService, ANALYSIS_STEPS } from '../../../src/backend/src/services/analysis.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  single: jest.fn(),
  rpc: jest.fn()
};

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let testProjectId: string;
  let testSessionId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    analysisService = new AnalysisService();
    testProjectId = testUtils.generateTestId();
    testSessionId = testUtils.generateTestId();
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createAnalysisSession', () => {
    it('should create a new analysis session', async () => {
      const mockSession = {
        id: testSessionId,
        project_id: testProjectId,
        status: 'created',
        progress: 0,
        started_at: new Date().toISOString()
      };

      // Mock RPC function call
      mockSupabase.rpc.mockResolvedValueOnce({
        data: testSessionId,
        error: null
      });

      // Mock session retrieval
      mockSupabase.single.mockResolvedValue({
        data: mockSession,
        error: null
      });

      const result = await analysisService.createAnalysisSession(testProjectId);

      expect(result).toEqual(mockSession);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'start_analysis_session',
        { project_uuid: testProjectId }
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_sessions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testSessionId);
    });

    it('should throw error when RPC function fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC function failed' }
      });

      await expect(
        analysisService.createAnalysisSession(testProjectId)
      ).rejects.toThrow('Failed to create analysis session: RPC function failed');
    });

    it('should throw error when session retrieval fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: testSessionId,
        error: null
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Session not found' }
      });

      await expect(
        analysisService.createAnalysisSession(testProjectId)
      ).rejects.toThrow('Failed to get created session: Session not found');
    });
  });

  describe('getAnalysisSession', () => {
    it('should retrieve an analysis session', async () => {
      const mockSession = {
        id: testSessionId,
        project_id: testProjectId,
        status: 'processing',
        progress: 50
      };

      mockSupabase.single.mockResolvedValue({
        data: mockSession,
        error: null
      });

      const result = await analysisService.getAnalysisSession(testSessionId);

      expect(result).toEqual(mockSession);
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_sessions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testSessionId);
    });

    it('should return null when session not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await analysisService.getAnalysisSession(testSessionId);

      expect(result).toBeNull();
    });
  });

  describe('updateAnalysisProgress', () => {
    it('should update analysis progress using RPC function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      const result = await analysisService.updateAnalysisProgress(
        testSessionId,
        75,
        'Strategic analysis',
        30
      );

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'update_analysis_progress',
        {
          session_uuid: testSessionId,
          progress_val: 75,
          step_name: 'Strategic analysis',
          remaining_seconds: 30
        }
      );
    });

    it('should handle progress update without estimated remaining time', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null
      });

      await analysisService.updateAnalysisProgress(
        testSessionId,
        50,
        'Mapping questions'
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'update_analysis_progress',
        {
          session_uuid: testSessionId,
          progress_val: 50,
          step_name: 'Mapping questions',
          remaining_seconds: undefined
        }
      );
    });
  });

  describe('completeAnalysisSession', () => {
    it('should mark session as completed', async () => {
      const mockCompletedSession = {
        id: testSessionId,
        status: 'completed',
        progress: 100,
        current_step: 'Completed',
        completed_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCompletedSession,
        error: null
      });

      const result = await analysisService.completeAnalysisSession(testSessionId);

      expect(result).toEqual(mockCompletedSession);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progress: 100,
          current_step: 'Completed',
          estimated_remaining_seconds: 0
        })
      );
    });
  });

  describe('failAnalysisSession', () => {
    it('should mark session as failed with error message', async () => {
      const errorMessage = 'AI processing failed';
      const mockFailedSession = {
        id: testSessionId,
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockFailedSession,
        error: null
      });

      const result = await analysisService.failAnalysisSession(testSessionId, errorMessage);

      expect(result).toEqual(mockFailedSession);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: errorMessage
        })
      );
    });
  });

  describe('saveAnalysisResult', () => {
    it('should save analysis result to database', async () => {
      const resultData = { themes: ['Theme 1', 'Theme 2'], count: 2 };
      const mockResult = {
        id: testUtils.generateTestId(),
        project_id: testProjectId,
        session_id: testSessionId,
        result_type: 'themes',
        data: resultData
      };

      mockSupabase.single.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const result = await analysisService.saveAnalysisResult(
        testProjectId,
        testSessionId,
        'themes',
        resultData
      );

      expect(result).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: testProjectId,
          session_id: testSessionId,
          result_type: 'themes',
          data: resultData
        })
      );
    });
  });

  describe('getAnalysisResults', () => {
    it('should retrieve all results for a session', async () => {
      const mockResults = [
        { id: '1', result_type: 'themes', data: {} },
        { id: '2', result_type: 'statistics', data: {} }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockResults,
        error: null
      });

      const result = await analysisService.getAnalysisResults(testSessionId);

      expect(result).toEqual(mockResults);
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_results');
      expect(mockSupabase.eq).toHaveBeenCalledWith('session_id', testSessionId);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should filter results by type', async () => {
      const mockResults = [{ id: '1', result_type: 'themes', data: {} }];

      mockSupabase.order.mockResolvedValue({
        data: mockResults,
        error: null
      });

      const result = await analysisService.getAnalysisResults(testSessionId, 'themes');

      expect(result).toEqual(mockResults);
      expect(mockSupabase.eq).toHaveBeenCalledWith('session_id', testSessionId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('result_type', 'themes');
    });
  });

  describe('getProjectAnalysisSessions', () => {
    it('should retrieve all sessions for a project', async () => {
      const mockSessions = [
        { id: '1', project_id: testProjectId, status: 'completed' },
        { id: '2', project_id: testProjectId, status: 'processing' }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockSessions,
        error: null
      });

      const result = await analysisService.getProjectAnalysisSessions(testProjectId);

      expect(result).toEqual(mockSessions);
      expect(mockSupabase.eq).toHaveBeenCalledWith('project_id', testProjectId);
      expect(mockSupabase.order).toHaveBeenCalledWith('started_at', { ascending: false });
    });
  });

  describe('getLatestAnalysisSession', () => {
    it('should retrieve the latest session for a project', async () => {
      const mockSession = {
        id: testSessionId,
        project_id: testProjectId,
        status: 'completed'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockSession,
        error: null
      });

      const result = await analysisService.getLatestAnalysisSession(testProjectId);

      expect(result).toEqual(mockSession);
      expect(mockSupabase.order).toHaveBeenCalledWith('started_at', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when no sessions exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await analysisService.getLatestAnalysisSession(testProjectId);

      expect(result).toBeNull();
    });
  });

  describe('formatProgressUpdate', () => {
    it('should format session data for progress updates', () => {
      const mockSession = {
        id: testSessionId,
        project_id: testProjectId,
        status: 'processing' as const,
        progress: 75,
        current_step: 'Strategic analysis',
        estimated_remaining_seconds: 30,
        error_message: null
      };

      const result = analysisService.formatProgressUpdate(mockSession);

      expect(result).toEqual({
        sessionId: testSessionId,
        projectId: testProjectId,
        status: 'processing',
        progress: 75,
        currentStep: 'Strategic analysis',
        estimatedRemaining: 30,
        error: undefined
      });
    });

    it('should handle session with error message', () => {
      const mockSession = {
        id: testSessionId,
        project_id: testProjectId,
        status: 'failed' as const,
        progress: 50,
        current_step: null,
        estimated_remaining_seconds: null,
        error_message: 'Processing failed'
      };

      const result = analysisService.formatProgressUpdate(mockSession);

      expect(result).toEqual({
        sessionId: testSessionId,
        projectId: testProjectId,
        status: 'failed',
        progress: 50,
        currentStep: 'Initializing',
        estimatedRemaining: undefined,
        error: 'Processing failed'
      });
    });
  });

  describe('calculateEstimatedTime', () => {
    it('should return base estimate for 0 progress', () => {
      const result = analysisService.calculateEstimatedTime(0, 300);
      expect(result).toBe(300);
    });

    it('should return 0 for 100% progress', () => {
      const result = analysisService.calculateEstimatedTime(100, 300);
      expect(result).toBe(0);
    });

    it('should calculate remaining time proportionally', () => {
      const result = analysisService.calculateEstimatedTime(50, 300);
      expect(result).toBe(150);
    });

    it('should use default base estimate', () => {
      const result = analysisService.calculateEstimatedTime(25);
      expect(result).toBe(225); // 75% of default 300
    });
  });

  describe('getStepProgress', () => {
    it('should return correct progress for each step', () => {
      expect(analysisService.getStepProgress('PREPROCESSING')).toBe(10);
      expect(analysisService.getStepProgress('EXTRACTING_VERBATIMS')).toBe(25);
      expect(analysisService.getStepProgress('MAPPING_QUESTIONS')).toBe(50);
      expect(analysisService.getStepProgress('EMERGENT_TOPICS')).toBe(70);
      expect(analysisService.getStepProgress('STRATEGIC_ANALYSIS')).toBe(85);
      expect(analysisService.getStepProgress('GENERATING_REPORTS')).toBe(95);
    });

    it('should return 0 for unknown step', () => {
      const result = analysisService.getStepProgress('UNKNOWN_STEP' as any);
      expect(result).toBe(0);
    });
  });

  describe('deleteAnalysisSession', () => {
    it('should delete session successfully', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: null
      });

      const result = await analysisService.deleteAnalysisSession(testSessionId);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_sessions');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testSessionId);
    });
  });

  describe('getAnalysisSummary', () => {
    it('should retrieve analysis summary using RPC function', async () => {
      const mockSummary = {
        transcripts_count: 3,
        verbatims_count: 50,
        topics_count: 5,
        question_mappings_count: 25,
        latest_session_status: 'completed',
        latest_session_progress: 100
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockSummary],
        error: null
      });

      const result = await analysisService.getAnalysisSummary(testProjectId);

      expect(result).toEqual(mockSummary);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_project_analysis_summary',
        { project_uuid: testProjectId }
      );
    });

    it('should return default summary when no data found', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await analysisService.getAnalysisSummary(testProjectId);

      expect(result).toEqual({
        transcripts_count: 0,
        verbatims_count: 0,
        topics_count: 0,
        question_mappings_count: 0,
        latest_session_status: null,
        latest_session_progress: 0
      });
    });
  });

  describe('ANALYSIS_STEPS constant', () => {
    it('should contain all expected steps', () => {
      expect(ANALYSIS_STEPS).toEqual({
        PREPROCESSING: 'Preprocessing files',
        EXTRACTING_VERBATIMS: 'Extracting verbatims',
        MAPPING_QUESTIONS: 'Mapping to questions',
        EMERGENT_TOPICS: 'Analyzing emergent topics',
        STRATEGIC_ANALYSIS: 'Strategic analysis',
        GENERATING_REPORTS: 'Generating reports'
      });
    });
  });
});