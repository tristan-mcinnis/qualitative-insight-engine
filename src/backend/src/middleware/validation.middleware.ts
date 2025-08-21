import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { config } from '../config';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        validationErrors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        validationErrors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        validationErrors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    next();
  };
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[] | undefined;
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const errors: string[] = [];

  for (const file of files) {
    // Check file size
    if (file.size > config.upload.maxFileSize) {
      errors.push(`File ${file.originalname} exceeds maximum size of ${config.upload.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File ${file.originalname} has unsupported type: ${file.mimetype}`);
    }

    // Check for potential security issues
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      errors.push(`File ${file.originalname} has invalid name`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'File validation failed',
      details: errors
    });
  }

  next();
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  projectId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  sessionId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  pagination: {
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  }
};

export const projectValidation = {
  create: {
    body: Joi.object({
      name: Joi.string().trim().min(1).max(255).required(),
      description: Joi.string().trim().max(1000).optional(),
      configuration: Joi.object({
        template: Joi.string().valid('standard', 'detailed', 'executive', 'custom').default('standard'),
        options: Joi.object({
          includeWordExport: Joi.boolean().default(true),
          includeExcelExport: Joi.boolean().default(true),
          enableRealTimeUpdates: Joi.boolean().default(true),
          batchSize: Joi.number().integer().min(1).max(50).default(10),
          confidenceThreshold: Joi.string().valid('Low', 'Medium', 'High').default('Medium')
        }).default({})
      }).optional()
    })
  },
  update: {
    params: Joi.object({
      projectId: commonSchemas.uuid
    }),
    body: Joi.object({
      name: Joi.string().trim().min(1).max(255).optional(),
      description: Joi.string().trim().max(1000).optional(),
      status: Joi.string().valid('created', 'uploaded', 'configured', 'processing', 'completed', 'failed').optional(),
      configuration: Joi.object().optional()
    })
  },
  get: {
    params: Joi.object({
      projectId: commonSchemas.uuid
    })
  },
  list: {
    query: Joi.object({
      limit: commonSchemas.pagination.limit,
      offset: commonSchemas.pagination.offset,
      status: Joi.string().valid('created', 'uploaded', 'configured', 'processing', 'completed', 'failed').optional()
    })
  }
};

export const uploadValidation = {
  files: {
    params: Joi.object({
      projectId: commonSchemas.uuid
    })
  }
};

export const analysisValidation = {
  start: {
    body: Joi.object({
      projectId: commonSchemas.uuid
    })
  },
  progress: {
    params: Joi.object({
      sessionId: commonSchemas.uuid
    })
  },
  results: {
    params: Joi.object({
      sessionId: commonSchemas.uuid
    }),
    query: Joi.object({
      resultType: Joi.string().valid('themes', 'statistics', 'insights', 'full_report').optional()
    })
  }
};