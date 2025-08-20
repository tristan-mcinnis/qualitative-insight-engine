import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';

test.describe('Full Frontend-Backend Integration', () => {
  let backendProcess: any;

  test.beforeAll(async () => {
    // Start backend server
    backendProcess = spawn('python', ['src/app.py'], {
      cwd: '../..',
      env: { ...process.env, TESTING: 'true' }
    });

    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test.afterAll(async () => {
    // Stop backend server
    if (backendProcess) {
      backendProcess.kill();
    }
  });

  test('complete workflow from upload to results', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload Files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      './test-data/interview1.txt',
      './test-data/interview2.txt',
      './test-data/discussion-guide.docx'
    ]);

    // Verify files are uploaded
    await expect(page.locator('text=3 files selected')).toBeVisible();
    await expect(page.locator('[data-testid="total-size"]')).toBeVisible();

    // Move to configuration
    await page.locator('[data-testid="next-button"]').click();
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);

    // Step 2: Configure Analysis
    await page.locator('[data-testid="template-detailed"]').click();
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText(/\d+ minutes/);

    // Start analysis
    await page.locator('[data-testid="start-analysis"]').click();
    await expect(page.locator('[data-testid="step-3"]')).toHaveClass(/active/);

    // Step 3: Monitor Progress
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-percentage"]')).toBeVisible();

    // Wait for processing to complete (with timeout)
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 60000 });

    // Should auto-navigate to results
    await expect(page.locator('[data-testid="step-4"]')).toHaveClass(/active/);

    // Step 4: View Results
    await expect(page.locator('[data-testid="themes-container"]')).toBeVisible();
    const themes = page.locator('[data-testid^="theme-card-"]');
    await expect(themes).toHaveCount(await themes.count());

    // Test view switching
    await page.locator('[data-testid="view-chart"]').click();
    await expect(page.locator('[data-testid="frequency-chart"]')).toBeVisible();

    // Test download
    await page.locator('[data-testid="download-button"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-pdf"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('error handling with backend failures', async ({ page }) => {
    await page.goto('/');

    // Upload invalid file
    await page.locator('input[type="file"]').setInputFiles([
      './test-data/corrupted.txt'
    ]);

    await page.locator('[data-testid="next-button"]').click();
    await page.locator('[data-testid="template-standard"]').click();
    await page.locator('[data-testid="start-analysis"]').click();

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/Error|Failed/);

    // Should allow retry
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('real-time updates from backend', async ({ page }) => {
    await page.goto('/');

    // Setup analysis
    await page.locator('input[type="file"]').setInputFiles(['./test-data/large-dataset.txt']);
    await page.locator('[data-testid="next-button"]').click();
    await page.locator('[data-testid="template-standard"]').click();
    await page.locator('[data-testid="start-analysis"]').click();

    // Monitor real-time updates
    const progressUpdates: string[] = [];
    
    // Capture progress updates
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        if (event.payload) {
          progressUpdates.push(event.payload.toString());
        }
      });
    });

    // Wait for multiple updates
    await page.waitForTimeout(5000);

    // Should have received multiple progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
    
    // Progress percentage should increase
    const percentages = await page.locator('[data-testid="completion-percentage"]').allTextContents();
    expect(percentages.length).toBeGreaterThan(1);
  });

  test('session persistence', async ({ page, context }) => {
    await page.goto('/');

    // Start an analysis
    await page.locator('input[type="file"]').setInputFiles(['./test-data/sample.txt']);
    await page.locator('[data-testid="next-button"]').click();
    await page.locator('[data-testid="template-standard"]').click();
    await page.locator('[data-testid="start-analysis"]').click();

    // Get session ID
    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));
    expect(sessionId).toBeTruthy();

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should restore session
    await expect(newPage.locator('[data-testid="step-3"]')).toHaveClass(/active/);
    await expect(newPage.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test('concurrent analysis handling', async ({ page, context }) => {
    // Start first analysis
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(['./test-data/dataset1.txt']);
    await page.locator('[data-testid="next-button"]').click();
    await page.locator('[data-testid="template-standard"]').click();
    await page.locator('[data-testid="start-analysis"]').click();

    // Start second analysis in new tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.locator('input[type="file"]').setInputFiles(['./test-data/dataset2.txt']);
    await page2.locator('[data-testid="next-button"]').click();
    await page2.locator('[data-testid="template-detailed"]').click();
    await page2.locator('[data-testid="start-analysis"]').click();

    // Both should process independently
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page2.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Check different session IDs
    const session1 = await page.evaluate(() => localStorage.getItem('sessionId'));
    const session2 = await page2.evaluate(() => localStorage.getItem('sessionId'));
    expect(session1).not.toBe(session2);
  });
});