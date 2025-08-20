import { test, expect } from '@playwright/test';

test.describe('Analysis Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Upload a file to enable navigation to config
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test content')
      }
    ]);
    
    // Navigate to configuration step
    await page.locator('button:has-text("Next: Configure")').click();
  });

  test('should validate project name', async ({ page }) => {
    const projectNameInput = page.locator('input[name="projectName"]');
    const runButton = page.locator('button:has-text("Run Analysis")');
    
    // Should be disabled without project name
    await expect(runButton).toBeDisabled();
    
    // Enter invalid project name (too short)
    await projectNameInput.fill('ab');
    await expect(page.locator('text=/at least 3 characters/')).toBeVisible();
    await expect(runButton).toBeDisabled();
    
    // Enter valid project name
    await projectNameInput.fill('My Test Project');
    await expect(page.locator('text=/at least 3 characters/')).not.toBeVisible();
    await expect(runButton).toBeEnabled();
  });

  test('should toggle output formats', async ({ page }) => {
    // Word output should be enabled by default
    const wordCheckbox = page.locator('input[name="generateWord"]');
    await expect(wordCheckbox).toBeChecked();
    
    // Excel output should be enabled by default
    const excelCheckbox = page.locator('input[name="generateExcel"]');
    await expect(excelCheckbox).toBeChecked();
    
    // Toggle Word output
    await wordCheckbox.click();
    await expect(wordCheckbox).not.toBeChecked();
    
    // Toggle Excel output
    await excelCheckbox.click();
    await expect(excelCheckbox).not.toBeChecked();
    
    // Should show warning when both are disabled
    await expect(page.locator('text=/at least one output format/')).toBeVisible();
  });

  test('should handle advanced options', async ({ page }) => {
    // Debug mode should be off by default
    const debugCheckbox = page.locator('input[name="debug"]');
    await expect(debugCheckbox).not.toBeChecked();
    
    // Dry run should be off by default
    const dryRunCheckbox = page.locator('input[name="dryRun"]');
    await expect(dryRunCheckbox).not.toBeChecked();
    
    // Toggle debug mode
    await debugCheckbox.click();
    await expect(debugCheckbox).toBeChecked();
    
    // Toggle dry run
    await dryRunCheckbox.click();
    await expect(dryRunCheckbox).toBeChecked();
    
    // Should show dry run warning
    await expect(page.locator('text=/Dry run mode|no API calls/')).toBeVisible();
  });

  test('should display configuration preview', async ({ page }) => {
    // Fill in configuration
    await page.locator('input[name="projectName"]').fill('Test Analysis');
    await page.locator('input[name="debug"]').click();
    
    // Check preview section
    const preview = page.locator('[data-testid="config-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Test Analysis');
    await expect(preview).toContainText('Word: Yes');
    await expect(preview).toContainText('Excel: Yes');
    await expect(preview).toContainText('Debug: Yes');
  });

  test('should navigate back to upload', async ({ page }) => {
    // Click back button
    await page.locator('button:has-text("Back to Upload")').click();
    
    // Should be back on upload step
    await expect(page.locator('text=Step 1: Upload Files')).toBeVisible();
    
    // Files should still be there
    await expect(page.locator('text=test.txt')).toBeVisible();
  });
});