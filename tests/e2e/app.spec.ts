import { test, expect } from '@playwright/test';

test.describe('TextGrouping Frontend', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/Qualitative Research Analysis/);
    await expect(page.locator('h1')).toContainText('Qualitative Research Analysis Pipeline');
  });

  test('should show connection status', async ({ page }) => {
    const status = page.locator('[data-testid="connection-status"]');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/Connected|Disconnected/);
  });

  test('should display file upload area', async ({ page }) => {
    const uploadArea = page.locator('[data-testid="file-upload"]');
    await expect(uploadArea).toBeVisible();
    await expect(uploadArea).toContainText('Drag and drop files here');
  });

  test('should show configuration form', async ({ page }) => {
    const configForm = page.locator('[data-testid="analysis-config"]');
    await expect(configForm).toBeVisible();
    
    const projectNameInput = page.locator('input[name="projectName"]');
    await expect(projectNameInput).toBeVisible();
    await expect(projectNameInput).toHaveAttribute('placeholder', 'Enter project name');
  });

  test('should navigate through steps', async ({ page }) => {
    // Step 1: Upload
    await expect(page.locator('text=Step 1: Upload Files')).toBeVisible();
    
    // Navigate to Step 2
    const nextButton = page.locator('button:has-text("Next: Configure")');
    await expect(nextButton).toBeDisabled(); // Should be disabled without files
    
    // Add mock file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      {
        name: 'test-guide.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Discussion Guide Content')
      }
    ]);
    
    // Now next button should be enabled
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Should be on Step 2
    await expect(page.locator('text=Step 2: Configure Analysis')).toBeVisible();
  });
});