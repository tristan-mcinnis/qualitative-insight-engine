import request from 'supertest';
import app from '../../../src/backend/src/index';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase for integration tests
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn()
    }))
  },
  insert: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  single: jest.fn(),
  rpc: jest.fn()
};

describe('API Integration Tests', () => {
  let testProjectId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    testProjectId = testUtils.generateTestId();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Qualitative Insight Engine API is healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('Projects API', () => {
    describe('POST /api/projects', () => {
      it('should create a new project', async () => {
        const testProject = testUtils.generateTestProject();
        const mockCreatedProject = {
          id: testProjectId,
          ...testProject,
          status: 'created',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockSupabase.single.mockResolvedValue({
          data: mockCreatedProject,
          error: null
        });

        const response = await request(app)
          .post('/api/projects')
          .send(testProject)
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: mockCreatedProject,
          message: 'Project created successfully'
        });
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/projects')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should handle database errors', async () => {
        mockSupabase.single.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        });

        const testProject = testUtils.generateTestProject();

        const response = await request(app)
          .post('/api/projects')
          .send(testProject)
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Failed to create project');
      });
    });

    describe('GET /api/projects/:projectId', () => {
      it('should retrieve a project by ID', async () => {
        const mockProject = {
          id: testProjectId,
          name: 'Test Project',
          status: 'created'
        };

        mockSupabase.single.mockResolvedValue({
          data: mockProject,
          error: null
        });

        const response = await request(app)
          .get(`/api/projects/${testProjectId}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockProject
        });
      });

      it('should return 404 for non-existent project', async () => {
        mockSupabase.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        });

        const response = await request(app)
          .get(`/api/projects/${testProjectId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Project not found');
      });

      it('should validate UUID format', async () => {
        const response = await request(app)
          .get('/api/projects/invalid-uuid')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/projects', () => {
      it('should list projects with default pagination', async () => {
        const mockProjects = [
          { id: '1', name: 'Project 1' },
          { id: '2', name: 'Project 2' }
        ];

        mockSupabase.range.mockResolvedValue({
          data: mockProjects,
          error: null
        });

        const response = await request(app)
          .get('/api/projects')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockProjects,
          pagination: {
            limit: 50,
            offset: 0,
            total: 2
          }
        });
      });

      it('should respect pagination parameters', async () => {
        mockSupabase.range.mockResolvedValue({
          data: [],
          error: null
        });

        const response = await request(app)
          .get('/api/projects?limit=10&offset=20')
          .expect(200);

        expect(response.body.pagination).toEqual({
          limit: 10,
          offset: 20,
          total: 0
        });
      });
    });

    describe('PUT /api/projects/:projectId', () => {
      it('should update a project', async () => {
        const updateData = { name: 'Updated Project Name' };
        const mockUpdatedProject = {
          id: testProjectId,
          ...updateData,
          updated_at: new Date().toISOString()
        };

        mockSupabase.single.mockResolvedValue({
          data: mockUpdatedProject,
          error: null
        });

        const response = await request(app)
          .put(`/api/projects/${testProjectId}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockUpdatedProject,
          message: 'Project updated successfully'
        });
      });
    });

    describe('DELETE /api/projects/:projectId', () => {
      it('should delete a project', async () => {
        mockSupabase.delete.mockResolvedValue({
          error: null
        });

        const response = await request(app)
          .delete(`/api/projects/${testProjectId}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Project deleted successfully'
        });
      });
    });
  });

  describe('File Upload API', () => {
    describe('POST /api/projects/:projectId/upload/guide', () => {
      it('should upload discussion guide', async () => {
        const mockGuide = {
          id: testUtils.generateTestId(),
          project_id: testProjectId,
          file_name: 'guide.txt',
          file_path: 'guides/test-path.txt'
        };

        // Mock Supabase storage upload
        mockSupabase.storage.from().upload.mockResolvedValue({
          data: { path: 'guides/test-path.txt' },
          error: null
        });

        // Mock database insert
        mockSupabase.single.mockResolvedValue({
          data: mockGuide,
          error: null
        });

        const response = await request(app)
          .post(`/api/projects/${testProjectId}/upload/guide`)
          .attach('file', Buffer.from('Test guide content'), 'guide.txt')
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: mockGuide,
          message: 'Discussion guide uploaded successfully'
        });
      });

      it('should validate file presence', async () => {
        const response = await request(app)
          .post(`/api/projects/${testProjectId}/upload/guide`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('No file uploaded');
      });
    });

    describe('POST /api/projects/:projectId/upload/transcripts', () => {
      it('should upload multiple transcript files', async () => {
        const mockTranscripts = [
          {
            id: testUtils.generateTestId(),
            project_id: testProjectId,
            file_name: 'transcript1.txt'
          },
          {
            id: testUtils.generateTestId(),
            project_id: testProjectId,
            file_name: 'transcript2.txt'
          }
        ];

        // Mock storage uploads
        mockSupabase.storage.from().upload
          .mockResolvedValueOnce({
            data: { path: 'transcripts/file1.txt' },
            error: null
          })
          .mockResolvedValueOnce({
            data: { path: 'transcripts/file2.txt' },
            error: null
          });

        // Mock database inserts
        mockSupabase.single
          .mockResolvedValueOnce({
            data: mockTranscripts[0],
            error: null
          })
          .mockResolvedValueOnce({
            data: mockTranscripts[1],
            error: null
          });

        const response = await request(app)
          .post(`/api/projects/${testProjectId}/upload/transcripts`)
          .attach('files', Buffer.from('Transcript 1 content'), 'transcript1.txt')
          .attach('files', Buffer.from('Transcript 2 content'), 'transcript2.txt')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.message).toContain('2 transcript(s) uploaded successfully');
      });
    });
  });

  describe('Analysis API', () => {
    describe('POST /api/analysis/start', () => {
      it('should start analysis for a project', async () => {
        const sessionId = testUtils.generateTestId();

        // Mock project validation
        mockSupabase.single
          .mockResolvedValueOnce({
            data: { id: testProjectId, name: 'Test Project' },
            error: null
          })
          // Mock guide check
          .mockResolvedValueOnce({
            data: { id: 'guide-id', project_id: testProjectId },
            error: null
          })
          // Mock session creation
          .mockResolvedValueOnce({
            data: {
              id: sessionId,
              project_id: testProjectId,
              status: 'created'
            },
            error: null
          });

        // Mock transcripts check
        mockSupabase.order.mockResolvedValue({
          data: [{ id: 'transcript-id', project_id: testProjectId }],
          error: null
        });

        // Mock RPC session creation
        mockSupabase.rpc.mockResolvedValue({
          data: sessionId,
          error: null
        });

        const response = await request(app)
          .post('/api/analysis/start')
          .send({ projectId: testProjectId })
          .expect(201);

        expect(response.body).toEqual({
          success: true,
          data: {
            sessionId: sessionId,
            projectId: testProjectId,
            status: 'processing',
            message: 'Analysis started successfully'
          }
        });
      });

      it('should reject analysis for project without guide', async () => {
        // Mock project exists
        mockSupabase.single
          .mockResolvedValueOnce({
            data: { id: testProjectId, name: 'Test Project' },
            error: null
          })
          // Mock no guide found
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          });

        const response = await request(app)
          .post('/api/analysis/start')
          .send({ projectId: testProjectId })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Project must have a discussion guide before starting analysis');
      });
    });

    describe('GET /api/analysis/progress/:sessionId', () => {
      it('should return analysis progress', async () => {
        const sessionId = testUtils.generateTestId();
        const mockSession = {
          id: sessionId,
          project_id: testProjectId,
          status: 'processing',
          progress: 75,
          current_step: 'Strategic analysis',
          estimated_remaining_seconds: 30
        };

        mockSupabase.single.mockResolvedValue({
          data: mockSession,
          error: null
        });

        const response = await request(app)
          .get(`/api/analysis/progress/${sessionId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual({
          sessionId: sessionId,
          projectId: testProjectId,
          status: 'processing',
          progress: 75,
          currentStep: 'Strategic analysis',
          estimatedRemaining: 30,
          error: undefined
        });
      });

      it('should return 404 for non-existent session', async () => {
        const sessionId = testUtils.generateTestId();

        mockSupabase.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        });

        const response = await request(app)
          .get(`/api/analysis/progress/${sessionId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Analysis session not found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('API endpoint not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid JSON in request body');
    });

    it('should handle large files', async () => {
      const largeContent = 'x'.repeat(20 * 1024 * 1024); // 20MB

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/upload/guide`)
        .attach('file', Buffer.from(largeContent), 'large-file.txt')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('File too large');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/projects')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});