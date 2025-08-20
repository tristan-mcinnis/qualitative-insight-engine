import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload files via drag and drop', async ({ page }) => {
    const dropZone = page.locator('[data-testid="file-upload"]');
    
    // Create test files
    const files = [
      {
        name: 'discussion-guide.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from('Discussion guide content')
      },
      {
        name: 'transcript.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Interview transcript content')
      }
    ];
    
    // Simulate file drop
    await page.locator('input[type="file"]').setInputFiles(files);
    
    // Check files are displayed
    await expect(page.locator('text=discussion-guide.docx')).toBeVisible();
    await expect(page.locator('text=transcript.txt')).toBeVisible();
    
    // Check file count
    await expect(page.locator('text=2 files selected')).toBeVisible();
  });

  test('should validate file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload invalid file type
    await fileInput.setInputFiles([
      {
        name: 'invalid.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('Invalid file')
      }
    ]);
    
    // Should show error message
    await expect(page.locator('text=/Invalid file type|not supported/')).toBeVisible();
  });

  test('should remove uploaded files', async ({ page }) => {
    // Upload a file
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test content')
      }
    ]);
    
    // File should be visible
    await expect(page.locator('text=test.txt')).toBeVisible();
    
    // Click remove button
    const removeButton = page.locator('[data-testid="remove-file-test.txt"]');
    await removeButton.click();
    
    // File should be removed
    await expect(page.locator('text=test.txt')).not.toBeVisible();
  });

  test('should handle large files', async ({ page }) => {
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
    
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'large-file.txt',
        mimeType: 'text/plain',
        buffer: largeBuffer
      }
    ]);
    
    // Should show warning for large file
    await expect(page.locator('text=/File size|too large|15MB/')).toBeVisible();
  });

  test('should support multiple file selection', async ({ page }) => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `file-${i + 1}.txt`,
      mimeType: 'text/plain',
      buffer: Buffer.from(`Content ${i + 1}`)
    }));
    
    await page.locator('input[type="file"]').setInputFiles(files);
    
    // All files should be visible
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=file-${i}.txt`)).toBeVisible();
    }
    
    // Check count
    await expect(page.locator('text=5 files selected')).toBeVisible();
  });
});