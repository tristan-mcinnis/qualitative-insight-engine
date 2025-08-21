import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  openai: {
    apiKey: string;
  };
  pinecone?: {
    apiKey: string;
    indexName: string;
    host: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  upload: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  pinecone: process.env.PINECONE_API_KEY ? {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME || '',
    host: process.env.PINECONE_HOST || '',
  } : undefined,
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Add production URLs as needed
    credentials: true,
  },
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
  },
};

export function validateConfig(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}