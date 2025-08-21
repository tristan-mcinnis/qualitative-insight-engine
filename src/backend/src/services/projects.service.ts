import { supabase } from '../config/supabase';
import { Database, ProjectConfiguration, ProjectStatus } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export class ProjectsService {
  
  async createProject(name: string, description?: string, configuration?: ProjectConfiguration): Promise<Project> {
    const newProject: ProjectInsert = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || null,
      status: 'created',
      configuration: configuration || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return data;
  }

  async updateProject(projectId: string, updates: Partial<ProjectUpdate>): Promise<Project> {
    const updateData: ProjectUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    return this.updateProject(projectId, { status });
  }

  async updateProjectConfiguration(projectId: string, configuration: ProjectConfiguration): Promise<Project> {
    return this.updateProject(projectId, { configuration });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    return true;
  }

  async listProjects(limit: number = 50, offset: number = 0): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }

    return data || [];
  }

  async getProjectWithSummary(projectId: string) {
    // Get project details
    const project = await this.getProject(projectId);
    if (!project) {
      return null;
    }

    // Get analysis summary using the database function
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_project_analysis_summary', { project_uuid: projectId });

    if (summaryError) {
      throw new Error(`Failed to get project summary: ${summaryError.message}`);
    }

    return {
      ...project,
      summary: summary?.[0] || {
        transcripts_count: 0,
        verbatims_count: 0,
        topics_count: 0,
        question_mappings_count: 0,
        latest_session_status: null,
        latest_session_progress: 0
      }
    };
  }

  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get projects by status: ${error.message}`);
    }

    return data || [];
  }

  async validateProjectExists(projectId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to validate project: ${error.message}`);
    }

    return !!data;
  }
}