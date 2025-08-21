import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getUploadsService } from '../services';
import { validate, uploadValidation, validateFileUpload } from '../middleware/validation.middleware';
import { authMiddleware, validateProjectAccess } from '../middleware/auth.middleware';
import { config } from '../config';

const router = Router();
const uploadsService = getUploadsService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/projects/:projectId/upload/guide
 * Upload discussion guide file
 */
router.post(
  '/:projectId/upload/guide',
  validate(uploadValidation.files),
  validateProjectAccess,
  upload.single('file'),
  validateFileUpload,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Extract text content if provided in form data
      const content = req.body.content || null;

      const guide = await uploadsService.uploadDiscussionGuide(
        projectId,
        file,
        content
      );

      res.status(201).json({
        success: true,
        data: guide,
        message: 'Discussion guide uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading discussion guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload discussion guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/projects/:projectId/upload/transcripts
 * Upload transcript files (multiple files supported)
 */
router.post(
  '/:projectId/upload/transcripts',
  validate(uploadValidation.files),
  validateProjectAccess,
  upload.array('files', 10),
  validateFileUpload,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const uploadedTranscripts = [];
      const errors = [];

      // Process each file
      for (const file of files) {
        try {
          const transcript = await uploadsService.uploadTranscript(
            projectId,
            file
          );
          uploadedTranscripts.push(transcript);
        } catch (error) {
          errors.push({
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Return results
      const response: any = {
        success: errors.length === 0,
        data: uploadedTranscripts,
        message: `${uploadedTranscripts.length} transcript(s) uploaded successfully`
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += `, ${errors.length} failed`;
      }

      res.status(uploadedTranscripts.length > 0 ? 201 : 400).json(response);
    } catch (error) {
      console.error('Error uploading transcripts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload transcripts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/files/guide
 * Get discussion guide for project
 */
router.get(
  '/:projectId/files/guide',
  validate(uploadValidation.files),
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      const guide = await uploadsService.getProjectDiscussionGuide(projectId);
      
      if (!guide) {
        return res.status(404).json({
          success: false,
          error: 'Discussion guide not found for this project'
        });
      }

      res.json({
        success: true,
        data: guide
      });
    } catch (error) {
      console.error('Error getting discussion guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get discussion guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/files/transcripts
 * Get all transcripts for project
 */
router.get(
  '/:projectId/files/transcripts',
  validate(uploadValidation.files),
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      const transcripts = await uploadsService.getProjectTranscripts(projectId);

      res.json({
        success: true,
        data: transcripts,
        count: transcripts.length
      });
    } catch (error) {
      console.error('Error getting transcripts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transcripts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/projects/:projectId/files/:fileType/:fileId/download
 * Get download URL for a file
 */
router.get(
  '/:projectId/files/:fileType/:fileId/download',
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { projectId, fileType, fileId } = req.params;
      const { expiresIn = 3600 } = req.query;
      
      let filePath: string;
      let bucket: string;

      // Determine bucket and get file path
      if (fileType === 'guide') {
        bucket = 'guides';
        const guide = await uploadsService.getProjectDiscussionGuide(projectId);
        if (!guide || guide.id !== fileId) {
          return res.status(404).json({
            success: false,
            error: 'Discussion guide not found'
          });
        }
        filePath = guide.file_path;
      } else if (fileType === 'transcript') {
        bucket = 'transcripts';
        const transcripts = await uploadsService.getProjectTranscripts(projectId);
        const transcript = transcripts.find(t => t.id === fileId);
        if (!transcript) {
          return res.status(404).json({
            success: false,
            error: 'Transcript not found'
          });
        }
        filePath = transcript.file_path;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Must be "guide" or "transcript"'
        });
      }

      const downloadUrl = await uploadsService.getFileDownloadUrl(
        bucket,
        filePath,
        Number(expiresIn)
      );

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresIn: Number(expiresIn)
        }
      });
    } catch (error) {
      console.error('Error generating download URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/files/guide/:guideId
 * Delete discussion guide
 */
router.delete(
  '/:projectId/files/guide/:guideId',
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { guideId } = req.params;
      
      await uploadsService.deleteDiscussionGuide(guideId);

      res.json({
        success: true,
        message: 'Discussion guide deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting discussion guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete discussion guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/files/transcript/:transcriptId
 * Delete transcript
 */
router.delete(
  '/:projectId/files/transcript/:transcriptId',
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { transcriptId } = req.params;
      
      await uploadsService.deleteTranscript(transcriptId);

      res.json({
        success: true,
        message: 'Transcript deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transcript:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/projects/:projectId/files/guide/:guideId/content
 * Update discussion guide content and objectives
 */
router.put(
  '/:projectId/files/guide/:guideId/content',
  validateProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const { guideId } = req.params;
      const { content, objectives } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required'
        });
      }

      const guide = await uploadsService.updateDiscussionGuideContent(
        guideId,
        content,
        objectives
      );

      res.json({
        success: true,
        data: guide,
        message: 'Discussion guide updated successfully'
      });
    } catch (error) {
      console.error('Error updating discussion guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update discussion guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;