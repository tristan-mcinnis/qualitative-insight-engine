import { test, expect } from '@playwright/test';

test.describe('Enhanced Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup: Upload file and configure analysis
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    await page.locator('[data-testid="next-button"]').click();
    await page.locator('[data-testid="template-standard"]').click();
    await page.locator('[data-testid="start-analysis"]').click();
  });

  test('should display live metrics', async ({ page }) => {
    // Check for all metric displays
    await expect(page.locator('[data-testid="completion-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="elapsed-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="eta"]')).toBeVisible();
  });

  test('should show timeline visualization', async ({ page }) => {
    const timeline = page.locator('[data-testid="progress-timeline"]');
    await expect(timeline).toBeVisible();
    
    // Check for timeline steps
    const steps = ['Preprocessing', 'Theme Extraction', 'Analysis', 'Report Generation'];
    for (const step of steps) {
      await expect(timeline.locator(`text=${step}`)).toBeVisible();
    }
  });

  test('should update progress bar', async ({ page }) => {
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Check initial state
    const initialWidth = await progressBar.evaluate(el => el.style.width);
    
    // Wait for progress
    await page.waitForTimeout(2000);
    
    // Progress should have increased
    const newWidth = await progressBar.evaluate(el => el.style.width);
    expect(parseInt(newWidth)).toBeGreaterThan(parseInt(initialWidth));
  });

  test('should allow pause and resume', async ({ page }) => {
    const pauseButton = page.locator('[data-testid="pause-button"]');
    await expect(pauseButton).toBeVisible();
    
    // Click pause
    await pauseButton.click();
    await expect(page.locator('[data-testid="status"]')).toContainText('Paused');
    
    // Resume button should appear
    const resumeButton = page.locator('[data-testid="resume-button"]');
    await expect(resumeButton).toBeVisible();
    
    // Click resume
    await resumeButton.click();
    await expect(page.locator('[data-testid="status"]')).toContainText('Processing');
  });

  test('should show step timestamps', async ({ page }) => {
    // Wait for first step to complete
    await page.waitForSelector('[data-testid="step-preprocessing-complete"]', { timeout: 10000 });
    
    // Check timestamp is displayed
    const timestamp = page.locator('[data-testid="step-preprocessing-timestamp"]');
    await expect(timestamp).toBeVisible();
    await expect(timestamp).toContainText(/\d{2}:\d{2}:\d{2}/);
  });

  test('should display processing rate', async ({ page }) => {
    const processingRate = page.locator('[data-testid="processing-rate"]');
    await expect(processingRate).toBeVisible();
    
    // Should show rate in items/sec or MB/s
    await expect(processingRate).toContainText(/\d+\.?\d* (items|MB)\/s/);
  });

  test('should show accurate ETA', async ({ page }) => {
    const eta = page.locator('[data-testid="eta"]');
    await expect(eta).toBeVisible();
    
    // ETA should be in format "X minutes remaining" or "X seconds remaining"
    await expect(eta).toContainText(/\d+ (seconds?|minutes?) remaining/);
    
    // Wait and check ETA decreases
    const initialETA = await eta.textContent();
    await page.waitForTimeout(3000);
    const newETA = await eta.textContent();
    
    // Parse numbers from ETA strings
    const getTime = (str: string | null) => {
      const match = str?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    expect(getTime(newETA)).toBeLessThanOrEqual(getTime(initialETA));
  });
});