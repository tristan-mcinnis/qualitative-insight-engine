import { Router } from 'express';
import projectsRoutes from './projects.routes';
import uploadsRoutes from './uploads.routes';
import analysisRoutes from './analysis.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Qualitative Insight Engine API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route modules
router.use('/projects', projectsRoutes);
router.use('/projects', uploadsRoutes); // Upload routes are scoped under projects
router.use('/analysis', analysisRoutes);

// Fallback route for 404s
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;