import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Basic authentication middleware (placeholder for future auth implementation)
 * Currently allows all requests through since auth is not implemented yet
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // For now, just proceed without authentication
    // In the future, this could verify JWT tokens or API keys
    
    // Example of how this would work with Supabase auth:
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (token) {
    //   const { data: { user }, error } = await supabase.auth.getUser(token);
    //   if (error || !user) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    //   }
    //   req.user = user;
    // }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Validate project access (placeholder for future multi-user support)
 */
export const validateProjectAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.body.project_id;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // For now, just check if project exists
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    next();
  } catch (error) {
    console.error('Project access validation error:', error);
    res.status(500).json({ error: 'Internal server error during project validation' });
  }
};

/**
 * API key validation middleware (for external integrations)
 */
export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'];
  
  // For now, just check if API key is present
  // In production, this should validate against stored API keys
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // TODO: Validate API key against database
  next();
};