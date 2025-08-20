import { test, expect } from '@playwright/test';

test.describe('Results Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Mock completed analysis results
    await page.route('**/api/results', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          summary: {
            filesProcessed: 5,
            themesIdentified: 12,
            insightsGenerated: 8,
            processingTime: '2m 34s'
          },
          themes: [
            {
              id: '1',
              name: 'User Experience',
              frequency: 45,
              sentiment: 'positive',
              examples: ['Great interface', 'Easy to use']
            },
            {
              id: '2',
              name: 'Performance Issues',
              frequency: 23,
              sentiment: 'negative',
              examples: ['Slow loading', 'Laggy response']
            }
          ],
          reports: [
            { name: 'master_strategic_report.xlsx', size: '245KB', type: 'excel' },
            { name: 'analysis_report.docx', size: '128KB', type: 'word' },
            { name: 'executive_summary.docx', size: '45KB', type: 'word' }
          ]
        })
      });
    });
    
    // Navigate directly to results (simulate completed analysis)
    await page.evaluate(() => {
      window.history.pushState({}, '', '/#results');
    });
    await page.reload();
  });

  test('should display summary statistics', async ({ page }) => {
    const summary = page.locator('[data-testid="results-summary"]');
    await expect(summary).toBeVisible();
    
    // Check statistics
    await expect(summary).toContainText('5');
    await expect(summary).toContainText('Files Processed');
    await expect(summary).toContainText('12');
    await expect(summary).toContainText('Themes');
    await expect(summary).toContainText('8');
    await expect(summary).toContainText('Insights');
    await expect(summary).toContainText('2m 34s');
  });

  test('should show tabbed interface', async ({ page }) => {
    // Check tabs exist
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
    
    await expect(tabs.locator('text=Summary')).toBeVisible();
    await expect(tabs.locator('text=Themes')).toBeVisible();
    await expect(tabs.locator('text=Downloads')).toBeVisible();
    
    // Summary tab should be active by default
    await expect(tabs.locator('[aria-selected="true"]')).toContainText('Summary');
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click Themes tab
    await page.locator('[role="tab"]:has-text("Themes")').click();
    
    // Themes content should be visible
    await expect(page.locator('[data-testid="themes-content"]')).toBeVisible();
    await expect(page.locator('text=User Experience')).toBeVisible();
    await expect(page.locator('text=Performance Issues')).toBeVisible();
    
    // Click Downloads tab
    await page.locator('[role="tab"]:has-text("Downloads")').click();
    
    // Downloads content should be visible
    await expect(page.locator('[data-testid="downloads-content"]')).toBeVisible();
    await expect(page.locator('text=master_strategic_report.xlsx')).toBeVisible();
  });

  test('should display theme details', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Themes")').click();
    
    // Check theme cards
    const themeCard = page.locator('[data-testid="theme-card-1"]');
    await expect(themeCard).toBeVisible();
    await expect(themeCard).toContainText('User Experience');
    await expect(themeCard).toContainText('45');
    await expect(themeCard).toContainText('occurrences');
    
    // Check sentiment indicator
    const sentiment = themeCard.locator('[data-testid="sentiment-indicator"]');
    await expect(sentiment).toHaveAttribute('data-sentiment', 'positive');
    
    // Check examples
    await expect(themeCard).toContainText('Great interface');
    await expect(themeCard).toContainText('Easy to use');
  });

  test('should filter themes', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Themes")').click();
    
    // Search for theme
    const searchInput = page.locator('input[placeholder="Search themes..."]');
    await searchInput.fill('Performance');
    
    // Only matching theme should be visible
    await expect(page.locator('text=Performance Issues')).toBeVisible();
    await expect(page.locator('text=User Experience')).not.toBeVisible();
    
    // Clear search
    await searchInput.clear();
    
    // Both themes should be visible again
    await expect(page.locator('text=User Experience')).toBeVisible();
    await expect(page.locator('text=Performance Issues')).toBeVisible();
  });

  test('should download reports', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Downloads")').click();
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Mock download endpoint
    await page.route('**/api/download/**', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="report.xlsx"'
        },
        body: Buffer.from('Mock file content')
      });
    });
    
    // Click download button
    await page.locator('[data-testid="download-master_strategic_report.xlsx"]').click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should show file sizes and types', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Downloads")').click();
    
    // Check file information
    const fileList = page.locator('[data-testid="downloads-content"]');
    
    // Excel file
    const excelFile = fileList.locator('text=master_strategic_report.xlsx');
    await expect(excelFile).toBeVisible();
    await expect(fileList.locator('text=245KB')).toBeVisible();
    
    // Word files
    await expect(fileList.locator('text=analysis_report.docx')).toBeVisible();
    await expect(fileList.locator('text=128KB')).toBeVisible();
    
    // File type icons
    await expect(fileList.locator('[data-testid="file-icon-excel"]')).toBeVisible();
    await expect(fileList.locator('[data-testid="file-icon-word"]')).toHaveCount(2);
  });

  test('should handle export all', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Downloads")').click();
    
    // Mock zip download
    await page.route('**/api/download/all', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="analysis-results.zip"'
        },
        body: Buffer.from('Mock zip content')
      });
    });
    
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download All")').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.zip');
  });
});