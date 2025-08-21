import { createClient } from '@supabase/supabase-js';

// Test environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://owcstzxnpeyndgxlxxxx.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3N0enhucGV5bmRneGx4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDA5MjcsImV4cCI6MjA3MTMxNjkyN30.KSQexqQYuBu5vYLooRR0h9UWfk-TEmkiImf0YUOQIDg';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset console mocks
  console.error = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Global test utilities
global.testUtils = {
  // Generate test IDs
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Generate test project data
  generateTestProject: () => ({
    name: `Test Project ${Date.now()}`,
    description: 'A test project for automated testing',
    configuration: {
      template: 'standard' as const,
      options: {
        includeWordExport: true,
        includeExcelExport: true,
        enableRealTimeUpdates: true,
        batchSize: 10,
        confidenceThreshold: 'Medium' as const
      }
    }
  }),

  // Generate test verbatim data
  generateTestVerbatim: (projectId: string, transcriptId: string) => ({
    project_id: projectId,
    transcript_id: transcriptId,
    text: 'This is a test verbatim for automated testing purposes',
    speaker: 'Test Speaker',
    source_file: 'test-transcript.txt',
    line_number: 1
  }),

  // Generate test file buffer
  generateTestFileBuffer: (content: string = 'Test file content') => {
    return Buffer.from(content, 'utf8');
  },

  // Create mock Express.Multer.File
  createMockFile: (filename: string = 'test.txt', mimetype: string = 'text/plain', content: string = 'Test content') => ({
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: mimetype,
    size: Buffer.byteLength(content, 'utf8'),
    destination: '',
    filename: filename,
    path: '',
    buffer: Buffer.from(content, 'utf8'),
    stream: null as any,
    mv: jest.fn()
  })
};

// Type declaration for global test utilities
declare global {
  var testUtils: {
    generateTestId: () => string;
    generateTestProject: () => any;
    generateTestVerbatim: (projectId: string, transcriptId: string) => any;
    generateTestFileBuffer: (content?: string) => Buffer;
    createMockFile: (filename?: string, mimetype?: string, content?: string) => Express.Multer.File;
  };
}