import { Router, Request, Response } from 'express';
import { getAnalysisService, getAIProcessorService, getProjectsService, getUploadsService } from '../services';
import { validate, analysisValidation } from '../middleware/validation.middleware';
import { authMiddleware, validateProjectAccess } from '../middleware/auth.middleware';

const router = Router();
const analysisService = getAnalysisService();
const aiProcessorService = getAIProcessorService();
const projectsService = getProjectsService();
const uploadsService = getUploadsService();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/analysis/start
 * Start analysis process for a project
 */
router.post('/start', validate(analysisValidation.start), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    // Validate project exists and has required files
    const project = await projectsService.getProject(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if project has discussion guide and transcripts
    const guide = await uploadsService.getProjectDiscussionGuide(projectId);
    const transcripts = await uploadsService.getProjectTranscripts(projectId);
    
    if (!guide) {
      return res.status(400).json({
        success: false,
        error: 'Project must have a discussion guide before starting analysis'
      });
    }

    if (!transcripts || transcripts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project must have at least one transcript before starting analysis'
      });
    }

    // Create analysis session
    const session = await analysisService.createAnalysisSession(projectId);
    
    // Update project status
    await projectsService.updateProjectStatus(projectId, 'processing');

    // Start analysis process asynchronously
    // This would typically be handled by an Edge Function or background job
    processAnalysisAsync(session.id, projectId);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        projectId: projectId,
        status: 'processing',
        message: 'Analysis started successfully'
      }
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/progress/:sessionId
 * Get analysis progress for a session
 */
router.get('/progress/:sessionId', validate(analysisValidation.progress), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await analysisService.getAnalysisSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Analysis session not found'
      });
    }

    const progress = analysisService.formatProgressUpdate(session);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting analysis progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/results/:sessionId
 * Get analysis results for a session
 */
router.get('/results/:sessionId', validate(analysisValidation.results), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { resultType } = req.query;
    
    const session = await analysisService.getAnalysisSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Analysis session not found'
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Analysis not completed yet',
        currentStatus: session.status,
        progress: session.progress
      });
    }

    const results = await analysisService.getAnalysisResults(
      sessionId,
      resultType as any
    );

    res.json({
      success: true,
      data: results,
      sessionInfo: {
        sessionId: session.id,
        projectId: session.project_id,
        completedAt: session.completed_at
      }
    });
  } catch (error) {
    console.error('Error getting analysis results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/sessions/:projectId
 * Get all analysis sessions for a project
 */
router.get('/sessions/:projectId', validateProjectAccess, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const sessions = await analysisService.getProjectAnalysisSessions(projectId);

    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Error getting project sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/summary/:projectId
 * Get analysis summary for a project
 */
router.get('/summary/:projectId', validateProjectAccess, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const summary = await analysisService.getAnalysisSummary(projectId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting analysis summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analysis summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/analysis/sessions/:sessionId
 * Delete an analysis session
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    await analysisService.deleteAnalysisSession(sessionId);

    res.json({
      success: true,
      message: 'Analysis session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analysis session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/analysis/retry/:sessionId
 * Retry a failed analysis session
 */
router.post('/retry/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await analysisService.getAnalysisSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Analysis session not found'
      });
    }

    if (session.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Analysis is already in progress'
      });
    }

    // Reset session to processing state
    await analysisService.updateAnalysisProgress(
      sessionId,
      0,
      'Restarting analysis',
      300
    );

    // Start analysis process again
    processAnalysisAsync(sessionId, session.project_id);

    res.json({
      success: true,
      message: 'Analysis restarted successfully',
      data: {
        sessionId: sessionId,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error retrying analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Async function to process analysis (would be moved to Edge Function)
 */
async function processAnalysisAsync(sessionId: string, projectId: string): Promise<void> {
  try {
    console.log(`Starting analysis for session ${sessionId}, project ${projectId}`);
    
    // Step 1: Extract objectives from discussion guide
    await analysisService.updateAnalysisProgress(sessionId, 10, 'Extracting objectives from guide');
    
    const guide = await uploadsService.getProjectDiscussionGuide(projectId);
    if (!guide || !guide.content) {
      throw new Error('Discussion guide content not found');
    }

    const objectives = await aiProcessorService.extractGuideObjectives(guide.content);
    await uploadsService.updateDiscussionGuideContent(guide.id, guide.content, { objectives });

    // Step 2: Extract verbatims from transcripts
    await analysisService.updateAnalysisProgress(sessionId, 25, 'Extracting verbatims from transcripts');
    
    const transcripts = await uploadsService.getProjectTranscripts(projectId);
    const allVerbatims = [];
    
    for (const transcript of transcripts) {
      if (transcript.content) {
        const verbatims = await aiProcessorService.extractVerbatims(
          projectId,
          transcript.id,
          transcript.content,
          transcript.file_name
        );
        allVerbatims.push(...verbatims);
      }
    }

    // Step 3: Map verbatims to questions
    await analysisService.updateAnalysisProgress(sessionId, 50, 'Mapping verbatims to questions');
    
    if (objectives.length > 0 && allVerbatims.length > 0) {
      await aiProcessorService.mapVerbatimsToQuestions(projectId, allVerbatims, objectives);
    }

    // Step 4: Analyze emergent topics
    await analysisService.updateAnalysisProgress(sessionId, 70, 'Analyzing emergent topics');
    
    if (allVerbatims.length > 0) {
      await aiProcessorService.analyzeEmergentTopics(projectId, allVerbatims);
    }

    // Step 5: Strategic analysis
    await analysisService.updateAnalysisProgress(sessionId, 85, 'Performing strategic analysis');
    
    const topics = await aiProcessorService.getProjectTopics(projectId);
    for (const topic of topics) {
      const topicVerbatims = await aiProcessorService.getTopicVerbatims(
        projectId,
        topic.broad_topic,
        topic.sub_topic
      );
      
      if (topicVerbatims.length > 0) {
        await aiProcessorService.performStrategicAnalysis(
          projectId,
          topic.broad_topic,
          topic.sub_topic,
          topicVerbatims
        );
      }
    }

    // Step 6: Generate final report
    await analysisService.updateAnalysisProgress(sessionId, 95, 'Generating reports');
    
    // Save final results
    const finalResults = {
      totalVerbatims: allVerbatims.length,
      totalTopics: topics.length,
      totalObjectives: objectives.length,
      completedAt: new Date().toISOString()
    };

    await analysisService.saveAnalysisResult(
      projectId,
      sessionId,
      'full_report',
      finalResults
    );

    // Complete the analysis
    await analysisService.completeAnalysisSession(sessionId);
    await projectsService.updateProjectStatus(projectId, 'completed');

    console.log(`Analysis completed for session ${sessionId}`);
  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);
    
    await analysisService.failAnalysisSession(
      sessionId,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    await projectsService.updateProjectStatus(projectId, 'failed');
  }
}

export default router;