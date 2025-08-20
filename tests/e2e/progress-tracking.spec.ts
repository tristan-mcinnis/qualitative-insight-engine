import { test, expect } from '@playwright/test';

test.describe('Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Set up for analysis
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'guide.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Guide content')
      }
    ]);
    
    await page.locator('button:has-text("Next: Configure")').click();
    await page.locator('input[name="projectName"]').fill('Test Project');
  });

  test('should show progress during analysis', async ({ page }) => {
    // Mock API response for running analysis
    await page.route('**/api/run', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          taskId: 'test-123',
          status: 'running' 
        })
      });
    });

    // Mock status polling
    let pollCount = 0;
    await page.route('**/api/status', async route => {
      pollCount++;
      const statuses = [
        { status: 'running', progress: 25, currentStep: 'Extracting objectives' },
        { status: 'running', progress: 50, currentStep: 'Processing transcripts' },
        { status: 'running', progress: 75, currentStep: 'Generating insights' },
        { status: 'completed', progress: 100, currentStep: 'Analysis complete' }
      ];
      
      await route.fulfill({
        status: 200,
        body: JSON.stringify(statuses[Math.min(pollCount - 1, 3)])
      });
    });

    // Start analysis
    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show progress tracker
    await expect(page.locator('[data-testid="progress-tracker"]')).toBeVisible();
    
    // Check progress bar
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    
    // Check status text
    await expect(page.locator('text=/Extracting objectives|Processing|Generating/')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('text=Analysis complete')).toBeVisible({ timeout: 10000 });
  });

  test('should show timeline steps', async ({ page }) => {
    // Mock running analysis
    await page.route('**/api/run', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ taskId: 'test-123', status: 'running' })
      });
    });

    await page.locator('button:has-text("Run Analysis")').click();
    
    // Check timeline steps
    const timeline = page.locator('[data-testid="analysis-timeline"]');
    await expect(timeline).toBeVisible();
    
    const steps = [
      'Upload Files',
      'Extract Objectives',
      'Process Transcripts', 
      'Map Questions',
      'Identify Themes',
      'Generate Reports'
    ];
    
    for (const step of steps) {
      await expect(timeline.locator(`text=${step}`)).toBeVisible();
    }
  });

  test('should handle analysis errors', async ({ page }) => {
    // Mock API error
    await page.route('**/api/run', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Analysis failed: API rate limit exceeded' })
      });
    });

    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show error message
    await expect(page.locator('text=/Error|Failed|rate limit/')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('button:has-text("Retry")'))  .toBeVisible();
  });

  test('should show elapsed time', async ({ page }) => {
    await page.route('**/api/run', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ taskId: 'test-123', status: 'running' })
      });
    });

    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show elapsed time
    await expect(page.locator('text=/Elapsed|Duration|Time/')).toBeVisible();
    
    // Time should update
    await page.waitForTimeout(2000);
    const timeText = await page.locator('[data-testid="elapsed-time"]').textContent();
    expect(timeText).toMatch(/\d+:\d+/); // Should show time format
  });

  test('should allow cancellation', async ({ page }) => {
    await page.route('**/api/run', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ taskId: 'test-123', status: 'running' })
      });
    });

    await page.locator('button:has-text("Run Analysis")').click();
    
    // Should show cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
    
    // Mock cancel API
    await page.route('**/api/cancel', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'cancelled' })
      });
    });
    
    await cancelButton.click();
    
    // Should show cancelled status
    await expect(page.locator('text=/Cancelled|Stopped/')).toBeVisible();
  });
});