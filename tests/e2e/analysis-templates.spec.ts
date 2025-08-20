import { test, expect } from '@playwright/test';

test.describe('Analysis Configuration Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Upload a file to proceed to configuration
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    await page.locator('[data-testid="next-button"]').click();
  });

  test('should display report template options', async ({ page }) => {
    const templates = ['Standard', 'Detailed', 'Executive', 'Custom'];
    
    for (const template of templates) {
      await expect(page.locator(`[data-testid="template-${template.toLowerCase()}"]`)).toBeVisible();
    }
  });

  test('should select Standard template', async ({ page }) => {
    await page.locator('[data-testid="template-standard"]').click();
    await expect(page.locator('[data-testid="template-standard"]')).toHaveClass(/selected/);
    
    // Should show estimated time
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-time"]')).toContainText(/\d+ minutes/);
  });

  test('should select Detailed template with longer processing time', async ({ page }) => {
    await page.locator('[data-testid="template-detailed"]').click();
    await expect(page.locator('[data-testid="template-detailed"]')).toHaveClass(/selected/);
    
    // Should show longer estimated time
    const estimatedTime = page.locator('[data-testid="estimated-time"]');
    await expect(estimatedTime).toBeVisible();
    const detailedTime = await estimatedTime.textContent();
    
    // Switch to Standard to compare
    await page.locator('[data-testid="template-standard"]').click();
    const standardTime = await estimatedTime.textContent();
    
    // Detailed should take longer than Standard
    expect(parseInt(detailedTime || '0')).toBeGreaterThan(parseInt(standardTime || '0'));
  });

  test('should enable custom options for Custom template', async ({ page }) => {
    await page.locator('[data-testid="template-custom"]').click();
    
    // Custom options should appear
    await expect(page.locator('[data-testid="custom-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="theme-extraction"]')).toBeVisible();
    await expect(page.locator('[data-testid="sentiment-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="keyword-frequency"]')).toBeVisible();
  });

  test('should show configuration preview', async ({ page }) => {
    await page.locator('[data-testid="template-executive"]').click();
    
    const preview = page.locator('[data-testid="config-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Executive Report');
    await expect(preview).toContainText('High-level insights');
  });

  test('should update estimated time based on custom options', async ({ page }) => {
    await page.locator('[data-testid="template-custom"]').click();
    
    const baseTime = await page.locator('[data-testid="estimated-time"]').textContent();
    
    // Enable additional analysis options
    await page.locator('[data-testid="sentiment-analysis"]').check();
    await page.locator('[data-testid="keyword-frequency"]').check();
    
    const newTime = await page.locator('[data-testid="estimated-time"]').textContent();
    
    // Time should increase with more options
    expect(parseInt(newTime || '0')).toBeGreaterThan(parseInt(baseTime || '0'));
  });

  test('should validate configuration before proceeding', async ({ page }) => {
    // Try to proceed without selecting a template
    await page.locator('[data-testid="start-analysis"]').click();
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Please select a report template');
  });
});