import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display 4-step navigation', async ({ page }) => {
    const stepIndicator = page.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();
    
    const steps = page.locator('[data-testid^="step-"]');
    await expect(steps).toHaveCount(4);
    
    await expect(page.locator('[data-testid="step-1"]')).toContainText('Upload Files');
    await expect(page.locator('[data-testid="step-2"]')).toContainText('Configure Analysis');
    await expect(page.locator('[data-testid="step-3"]')).toContainText('Processing');
    await expect(page.locator('[data-testid="step-4"]')).toContainText('View Results');
  });

  test('should allow clicking step indicators to navigate', async ({ page }) => {
    // Upload a file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    
    // Move to step 2
    await page.locator('[data-testid="next-button"]').click();
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);
    
    // Click step 1 to go back
    await page.locator('[data-testid="step-1"]').click();
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
  });

  test('should show step completion indicators', async ({ page }) => {
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    
    // Move to step 2
    await page.locator('[data-testid="next-button"]').click();
    
    // Step 1 should show as completed
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/completed/);
  });

  test('should prevent navigation to invalid steps', async ({ page }) => {
    // Try to click step 3 without completing prerequisites
    await page.locator('[data-testid="step-3"]').click();
    
    // Should remain on step 1
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="step-3"]')).not.toHaveClass(/active/);
  });
});