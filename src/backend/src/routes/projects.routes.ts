import { Router, Request, Response } from 'express';
import { getProjectsService } from '../services';
import { validate, projectValidation } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const projectsService = getProjectsService();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', validate(projectValidation.create), async (req: Request, res: Response) => {
  try {
    const { name, description, configuration } = req.body;
    
    const project = await projectsService.createProject(name, description, configuration);
    
    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/projects
 * List all projects with pagination
 */
router.get('/', validate(projectValidation.list), async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let projects;
    if (status) {
      projects = await projectsService.getProjectsByStatus(status as any);
    } else {
      projects = await projectsService.listProjects(Number(limit), Number(offset));
    }
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: projects.length
      }
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/projects/:projectId
 * Get a specific project by ID
 */
router.get('/:projectId', validate(projectValidation.get), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const project = await projectsService.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/projects/:projectId/summary
 * Get project with analysis summary
 */
router.get('/:projectId/summary', validate(projectValidation.get), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const projectWithSummary = await projectsService.getProjectWithSummary(projectId);
    
    if (!projectWithSummary) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: projectWithSummary
    });
  } catch (error) {
    console.error('Error getting project summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get project summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update a project
 */
router.put('/:projectId', validate(projectValidation.update), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    const project = await projectsService.updateProject(projectId, updates);
    
    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/projects/:projectId/status
 * Update project status
 */
router.put('/:projectId/status', validate(projectValidation.get), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const project = await projectsService.updateProjectStatus(projectId, status);
    
    res.json({
      success: true,
      data: project,
      message: 'Project status updated successfully'
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/projects/:projectId/configuration
 * Update project configuration
 */
router.put('/:projectId/configuration', validate(projectValidation.get), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { configuration } = req.body;
    
    if (!configuration) {
      return res.status(400).json({
        success: false,
        error: 'Configuration is required'
      });
    }
    
    const project = await projectsService.updateProjectConfiguration(projectId, configuration);
    
    res.json({
      success: true,
      data: project,
      message: 'Project configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating project configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project
 */
router.delete('/:projectId', validate(projectValidation.get), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    await projectsService.deleteProject(projectId);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;