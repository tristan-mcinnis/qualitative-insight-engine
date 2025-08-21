import { supabase } from '../config/supabase';
import { Database } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

type DiscussionGuide = Database['public']['Tables']['discussion_guides']['Row'];
type DiscussionGuideInsert = Database['public']['Tables']['discussion_guides']['Insert'];
type Transcript = Database['public']['Tables']['transcripts']['Row'];
type TranscriptInsert = Database['public']['Tables']['transcripts']['Insert'];

export interface FileUploadResult {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
}

export class UploadsService {
  
  async uploadDiscussionGuide(
    projectId: string,
    file: Express.Multer.File,
    content?: string
  ): Promise<DiscussionGuide> {
    // Upload file to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${projectId}/${uuidv4()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('guides')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half'
      });

    if (uploadError) {
      throw new Error(`Failed to upload discussion guide: ${uploadError.message}`);
    }

    // Create database record
    const guideRecord: DiscussionGuideInsert = {
      id: uuidv4(),
      project_id: projectId,
      file_name: file.originalname,
      file_path: uploadData.path,
      content: content || null,
      objectives: null, // Will be populated by AI processing
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('discussion_guides')
      .insert(guideRecord)
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from('guides').remove([fileName]);
      throw new Error(`Failed to create discussion guide record: ${error.message}`);
    }

    return data;
  }

  async uploadTranscript(
    projectId: string,
    file: Express.Multer.File,
    content?: string
  ): Promise<Transcript> {
    // Upload file to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${projectId}/${uuidv4()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('transcripts')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        duplex: 'half'
      });

    if (uploadError) {
      throw new Error(`Failed to upload transcript: ${uploadError.message}`);
    }

    // Create database record
    const transcriptRecord: TranscriptInsert = {
      id: uuidv4(),
      project_id: projectId,
      file_name: file.originalname,
      file_path: uploadData.path,
      file_size: file.size,
      content_type: file.mimetype,
      content: content || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transcripts')
      .insert(transcriptRecord)
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from('transcripts').remove([fileName]);
      throw new Error(`Failed to create transcript record: ${error.message}`);
    }

    return data;
  }

  async getProjectDiscussionGuide(projectId: string): Promise<DiscussionGuide | null> {
    const { data, error } = await supabase
      .from('discussion_guides')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get discussion guide: ${error.message}`);
    }

    return data;
  }

  async getProjectTranscripts(projectId: string): Promise<Transcript[]> {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get transcripts: ${error.message}`);
    }

    return data || [];
  }

  async getFileDownloadUrl(bucket: string, filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return true;
  }

  async deleteDiscussionGuide(guideId: string): Promise<boolean> {
    // Get the guide to find the file path
    const { data: guide, error: getError } = await supabase
      .from('discussion_guides')
      .select('file_path')
      .eq('id', guideId)
      .single();

    if (getError) {
      throw new Error(`Failed to find discussion guide: ${getError.message}`);
    }

    // Delete file from storage
    await this.deleteFile('guides', guide.file_path);

    // Delete database record
    const { error: deleteError } = await supabase
      .from('discussion_guides')
      .delete()
      .eq('id', guideId);

    if (deleteError) {
      throw new Error(`Failed to delete discussion guide record: ${deleteError.message}`);
    }

    return true;
  }

  async deleteTranscript(transcriptId: string): Promise<boolean> {
    // Get the transcript to find the file path
    const { data: transcript, error: getError } = await supabase
      .from('transcripts')
      .select('file_path')
      .eq('id', transcriptId)
      .single();

    if (getError) {
      throw new Error(`Failed to find transcript: ${getError.message}`);
    }

    // Delete file from storage
    await this.deleteFile('transcripts', transcript.file_path);

    // Delete database record
    const { error: deleteError } = await supabase
      .from('transcripts')
      .delete()
      .eq('id', transcriptId);

    if (deleteError) {
      throw new Error(`Failed to delete transcript record: ${deleteError.message}`);
    }

    return true;
  }

  async updateDiscussionGuideContent(guideId: string, content: string, objectives?: any): Promise<DiscussionGuide> {
    const updates: any = {
      content: content,
      updated_at: new Date().toISOString()
    };

    if (objectives) {
      updates.objectives = objectives;
    }

    const { data, error } = await supabase
      .from('discussion_guides')
      .update(updates)
      .eq('id', guideId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update discussion guide: ${error.message}`);
    }

    return data;
  }

  async updateTranscriptContent(transcriptId: string, content: string): Promise<Transcript> {
    const { data, error } = await supabase
      .from('transcripts')
      .update({
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transcript: ${error.message}`);
    }

    return data;
  }

  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}