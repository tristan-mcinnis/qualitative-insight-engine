import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export class SupabaseConfig {
  private static instance: SupabaseClient<Database>;

  public static getClient(): SupabaseClient<Database> {
    if (!this.instance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      }

      this.instance = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false // For server-side usage
        },
        db: {
          schema: 'public'
        }
      });
    }

    return this.instance;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('projects')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      console.log('Supabase connection successful');
      return true;
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabase = SupabaseConfig.getClient();