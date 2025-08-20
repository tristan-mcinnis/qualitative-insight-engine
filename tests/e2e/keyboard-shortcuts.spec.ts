import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display keyboard shortcuts indicator', async ({ page }) => {
    const shortcutsIndicator = page.locator('[data-testid="keyboard-shortcuts"]');
    await expect(shortcutsIndicator).toBeVisible();
    await expect(shortcutsIndicator).toContainText('Keyboard Shortcuts');
  });

  test('Ctrl+U should trigger file upload', async ({ page }) => {
    // Press Ctrl+U
    await page.keyboard.press('Control+U');
    
    // Check if file chooser is triggered
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Control+U');
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('Ctrl+Enter should move to next step', async ({ page }) => {
    // Upload a file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    
    // Press Ctrl+Enter
    await page.keyboard.press('Control+Enter');
    
    // Should be on step 2
    await expect(page.locator('[data-testid="step-2"]')).toHaveClass(/active/);
  });

  test('Ctrl+R should restart workflow', async ({ page }) => {
    // Upload a file and move to step 2
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample.txt']);
    await page.locator('[data-testid="next-button"]').click();
    
    // Press Ctrl+R
    await page.keyboard.press('Control+R');
    
    // Should be back on step 1 with no files
    await expect(page.locator('[data-testid="step-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="file-list"]')).toBeEmpty();
  });

  test('Escape should dismiss dialogs', async ({ page }) => {
    // Trigger a dialog (e.g., error message)
    await page.locator('[data-testid="next-button"]').click(); // Try to proceed without files
    
    // Should show error
    const errorDialog = page.locator('[data-testid="error-dialog"]');
    await expect(errorDialog).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Dialog should be dismissed
    await expect(errorDialog).not.toBeVisible();
  });

  test('Delete key should remove selected files', async ({ page }) => {
    // Upload multiple files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-data/sample1.txt', './test-data/sample2.txt']);
    
    // Select first file
    await page.locator('[data-testid="file-item-0"]').click();
    
    // Press Delete
    await page.keyboard.press('Delete');
    
    // File should be removed
    await expect(page.locator('[data-testid="file-item-0"]')).not.toContainText('sample1.txt');
  });
});