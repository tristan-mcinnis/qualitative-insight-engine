import { ProjectsService } from '../../../src/backend/src/services/projects.service';
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
  range: jest.fn(() => mockSupabase),
  single: jest.fn(),
  rpc: jest.fn()
};

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let testProjectId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    projectsService = new ProjectsService();
    testProjectId = testUtils.generateTestId();
    
    // Reset mock implementation
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
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

      const result = await projectsService.createProject(
        testProject.name,
        testProject.description,
        testProject.configuration
      );

      expect(result).toEqual(mockCreatedProject);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should throw error when database insert fails', async () => {
      const testProject = testUtils.generateTestProject();

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(
        projectsService.createProject(testProject.name, testProject.description)
      ).rejects.toThrow('Failed to create project: Database error');
    });

    it('should handle missing optional parameters', async () => {
      const mockCreatedProject = {
        id: testProjectId,
        name: 'Test Project',
        description: null,
        configuration: null,
        status: 'created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedProject,
        error: null
      });

      const result = await projectsService.createProject('Test Project');

      expect(result).toEqual(mockCreatedProject);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          description: null,
          configuration: null
        })
      );
    });
  });

  describe('getProject', () => {
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

      const result = await projectsService.getProject(testProjectId);

      expect(result).toEqual(mockProject);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testProjectId);
    });

    it('should return null when project not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      });

      const result = await projectsService.getProject(testProjectId);

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' }
      });

      await expect(
        projectsService.getProject(testProjectId)
      ).rejects.toThrow('Failed to get project: Database connection error');
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
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

      const result = await projectsService.updateProject(testProjectId, updateData);

      expect(result).toEqual(mockUpdatedProject);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String)
        })
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testProjectId);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const newStatus = 'processing';
      const mockUpdatedProject = {
        id: testProjectId,
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedProject,
        error: null
      });

      const result = await projectsService.updateProjectStatus(testProjectId, newStatus);

      expect(result).toEqual(mockUpdatedProject);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: newStatus,
          updated_at: expect.any(String)
        })
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: null
      });

      const result = await projectsService.deleteProject(testProjectId);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', testProjectId);
    });

    it('should throw error when delete fails', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: { message: 'Cannot delete project' }
      });

      await expect(
        projectsService.deleteProject(testProjectId)
      ).rejects.toThrow('Failed to delete project: Cannot delete project');
    });
  });

  describe('listProjects', () => {
    it('should list projects with pagination', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockProjects,
        error: null
      });

      const result = await projectsService.listProjects(10, 0);

      expect(result).toEqual(mockProjects);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it('should handle empty results', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await projectsService.listProjects();

      expect(result).toEqual([]);
    });
  });

  describe('getProjectWithSummary', () => {
    it('should get project with analysis summary', async () => {
      const mockProject = { id: testProjectId, name: 'Test Project' };
      const mockSummary = {
        transcripts_count: 3,
        verbatims_count: 50,
        topics_count: 5,
        question_mappings_count: 25,
        latest_session_status: 'completed',
        latest_session_progress: 100
      };

      // Mock project retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: mockProject,
        error: null
      });

      // Mock summary retrieval
      mockSupabase.rpc.mockResolvedValue({
        data: [mockSummary],
        error: null
      });

      const result = await projectsService.getProjectWithSummary(testProjectId);

      expect(result).toEqual({
        ...mockProject,
        summary: mockSummary
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_project_analysis_summary',
        { project_uuid: testProjectId }
      );
    });

    it('should return null when project not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await projectsService.getProjectWithSummary(testProjectId);

      expect(result).toBeNull();
    });
  });

  describe('validateProjectExists', () => {
    it('should return true when project exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: testProjectId },
        error: null
      });

      const result = await projectsService.validateProjectExists(testProjectId);

      expect(result).toBe(true);
    });

    it('should return false when project does not exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await projectsService.validateProjectExists(testProjectId);

      expect(result).toBe(false);
    });
  });
});