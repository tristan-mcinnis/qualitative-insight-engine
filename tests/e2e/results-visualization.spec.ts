import { test, expect } from '@playwright/test';

test.describe('Results Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate directly to results (assuming completed analysis)
    await page.goto('/?step=4&mockResults=true');
  });

  test('should display multiple view modes', async ({ page }) => {
    // Check view mode buttons
    await expect(page.locator('[data-testid="view-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-chart"]')).toBeVisible();
  });

  test('should switch to grid view', async ({ page }) => {
    await page.locator('[data-testid="view-grid"]').click();
    
    // Grid container should be visible
    const gridContainer = page.locator('[data-testid="themes-grid"]');
    await expect(gridContainer).toBeVisible();
    
    // Should show theme cards in grid layout
    const themeCards = gridContainer.locator('[data-testid^="theme-card-"]');
    await expect(themeCards.first()).toBeVisible();
    
    // Check grid layout CSS
    const display = await gridContainer.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('grid');
  });

  test('should switch to list view', async ({ page }) => {
    await page.locator('[data-testid="view-list"]').click();
    
    // List container should be visible
    const listContainer = page.locator('[data-testid="themes-list"]');
    await expect(listContainer).toBeVisible();
    
    // Should show theme items in list format
    const themeItems = listContainer.locator('[data-testid^="theme-item-"]');
    await expect(themeItems.first()).toBeVisible();
  });

  test('should switch to chart view', async ({ page }) => {
    await page.locator('[data-testid="view-chart"]').click();
    
    // Chart container should be visible
    const chartContainer = page.locator('[data-testid="themes-chart"]');
    await expect(chartContainer).toBeVisible();
    
    // Should show visualization elements
    await expect(page.locator('[data-testid="frequency-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-legend"]')).toBeVisible();
  });

  test('should filter themes', async ({ page }) => {
    const filterInput = page.locator('[data-testid="filter-input"]');
    await filterInput.fill('communication');
    
    // Only matching themes should be visible
    const visibleThemes = page.locator('[data-testid^="theme-"][data-testid*="communication"]');
    await expect(visibleThemes.first()).toBeVisible();
    
    // Non-matching themes should be hidden
    const hiddenThemes = page.locator('[data-testid^="theme-"]:not([data-testid*="communication"])');
    await expect(hiddenThemes.first()).not.toBeVisible();
  });

  test('should sort themes', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('frequency');
    
    // Get all theme frequencies
    const frequencies = await page.locator('[data-testid^="theme-frequency-"]').allTextContents();
    const numbers = frequencies.map(f => parseInt(f.replace(/\D/g, '')));
    
    // Check if sorted in descending order
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBeLessThanOrEqual(numbers[i - 1]);
    }
  });

  test('should display insights tab', async ({ page }) => {
    await page.locator('[data-testid="tab-insights"]').click();
    
    // Insights content should be visible
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    
    // Should show statistical analysis
    await expect(insightsPanel.locator('text=/Key Themes|Top Patterns|Statistical Summary/')).toBeVisible();
  });

  test('should show download options', async ({ page }) => {
    const downloadButton = page.locator('[data-testid="download-button"]');
    await downloadButton.click();
    
    // Download menu should appear
    const downloadMenu = page.locator('[data-testid="download-menu"]');
    await expect(downloadMenu).toBeVisible();
    
    // Check download format options
    const formats = ['PDF', 'Excel', 'CSV', 'JSON'];
    for (const format of formats) {
      await expect(downloadMenu.locator(`text=${format}`)).toBeVisible();
    }
  });

  test('should preview download files', async ({ page }) => {
    await page.locator('[data-testid="download-button"]').click();
    await page.locator('[data-testid="download-pdf"]').hover();
    
    // Preview should appear
    const preview = page.locator('[data-testid="download-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('PDF Report');
    await expect(preview).toContainText(/\d+\.\d+ MB/);
  });

  test('should display theme details on click', async ({ page }) => {
    const firstTheme = page.locator('[data-testid^="theme-card-"]').first();
    await firstTheme.click();
    
    // Detail modal should open
    const detailModal = page.locator('[data-testid="theme-detail-modal"]');
    await expect(detailModal).toBeVisible();
    
    // Should show detailed information
    await expect(detailModal.locator('[data-testid="theme-quotes"]')).toBeVisible();
    await expect(detailModal.locator('[data-testid="theme-frequency"]')).toBeVisible();
    await expect(detailModal.locator('[data-testid="theme-sentiment"]')).toBeVisible();
  });
});