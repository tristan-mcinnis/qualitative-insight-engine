import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check main navigation
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label', /navigation|menu/i);
    
    // Check form inputs
    const projectNameInput = page.locator('input[name="projectName"]');
    await expect(projectNameInput).toHaveAttribute('aria-label', /project name/i);
    
    // Check buttons
    const uploadButton = page.locator('button:has-text("Next: Configure")');
    await expect(uploadButton).toHaveAttribute('aria-label', /next|continue/i);
    
    // Check file upload
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('aria-label', /upload|file/i);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
    
    // Tab to file upload
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should be able to trigger file upload with Enter
    focused = await page.evaluate(() => document.activeElement?.getAttribute('type'));
    expect(focused).toBe('file');
    
    // Tab to next button (after uploading file)
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test')
      }
    ]);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    
    // Should navigate to config step
    await expect(page.locator('text=Step 2: Configure Analysis')).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check h1 exists and is unique
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
    
    // Check heading hierarchy
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toContain('Qualitative Research Analysis');
    
    // Check h2 elements for sections
    const h2Elements = page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThan(0);
    
    // Verify no heading level is skipped
    const h3WithoutH2 = await page.evaluate(() => {
      const h3s = document.querySelectorAll('h3');
      for (const h3 of h3s) {
        let prev = h3.previousElementSibling;
        let foundH2 = false;
        while (prev) {
          if (prev.tagName === 'H2') {
            foundH2 = true;
            break;
          }
          prev = prev.previousElementSibling;
        }
        if (!foundH2) return false;
      }
      return true;
    });
    expect(h3WithoutH2).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check text contrast
    const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ });
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      const contrast = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        
        // Simple contrast check (would use a library in production)
        const getBrightness = (color: string) => {
          const rgb = color.match(/\d+/g);
          if (!rgb) return 0;
          return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        };
        
        const bgBrightness = getBrightness(bg);
        const fgBrightness = getBrightness(fg);
        return Math.abs(bgBrightness - fgBrightness);
      });
      
      // Minimum contrast difference
      expect(contrast).toBeGreaterThan(125);
    }
  });

  test('should have focus indicators', async ({ page }) => {
    // Check buttons have focus styles
    const button = page.locator('button').first();
    await button.focus();
    
    const focusStyle = await button.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border
      };
    });
    
    // Should have visible focus indicator
    expect(
      focusStyle.outline !== 'none' || 
      focusStyle.boxShadow !== 'none' ||
      focusStyle.border !== 'none'
    ).toBeTruthy();
  });

  test('should have alt text for images', async ({ page }) => {
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

  test('should announce dynamic content', async ({ page }) => {
    // Upload a file to trigger status update
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test')
      }
    ]);
    
    // Check for ARIA live region
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toHaveCount(1);
    
    // Check it announces the file upload
    await expect(liveRegion).toContainText(/file.*uploaded|added/i);
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for skip links
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveCount(1);
    
    // Check main content landmark
    const main = page.locator('main');
    await expect(main).toHaveCount(1);
    
    // Check for proper landmarks
    const landmarks = await page.evaluate(() => {
      return {
        header: document.querySelector('header') !== null,
        nav: document.querySelector('nav') !== null,
        main: document.querySelector('main') !== null,
        footer: document.querySelector('footer') !== null
      };
    });
    
    expect(landmarks.header).toBeTruthy();
    expect(landmarks.nav).toBeTruthy();
    expect(landmarks.main).toBeTruthy();
    expect(landmarks.footer).toBeTruthy();
  });

  test('should handle form validation accessibly', async ({ page }) => {
    // Navigate to config
    await page.locator('input[type="file"]').setInputFiles([
      {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test')
      }
    ]);
    await page.locator('button:has-text("Next: Configure")').click();
    
    // Try to submit without project name
    const projectInput = page.locator('input[name="projectName"]');
    await projectInput.fill('ab'); // Too short
    
    // Check for error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/at least 3 characters/);
    
    // Check input has aria-invalid
    await expect(projectInput).toHaveAttribute('aria-invalid', 'true');
    
    // Check input has aria-describedby pointing to error
    const describedBy = await projectInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    
    const errorElement = page.locator(`#${describedBy}`);
    await expect(errorElement).toBeVisible();
  });
});