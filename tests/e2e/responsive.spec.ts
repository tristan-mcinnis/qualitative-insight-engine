import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Check mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Open mobile menu
    await menuButton.click();
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Check layout is stacked
    const uploadSection = page.locator('[data-testid="file-upload"]');
    const configSection = page.locator('[data-testid="analysis-config"]');
    
    const uploadBox = await uploadSection.boundingBox();
    const configBox = await configSection.boundingBox();
    
    // On mobile, config should be below upload (stacked)
    if (uploadBox && configBox) {
      expect(configBox.y).toBeGreaterThan(uploadBox.y + uploadBox.height);
    }
    
    await context.close();
  });

  test('should work on tablet devices', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad'],
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Check tablet layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have side-by-side layout on tablet
    const container = page.locator('[data-testid="main-container"]');
    const containerWidth = await container.evaluate(el => el.clientWidth);
    
    // Tablet should have medium width
    expect(containerWidth).toBeGreaterThan(600);
    expect(containerWidth).toBeLessThan(1200);
    
    await context.close();
  });

  test('should adapt navigation for different screen sizes', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Desktop navigation should be visible
    const desktopNav = page.locator('[data-testid="desktop-nav"]');
    await expect(desktopNav).toBeVisible();
    
    // Mobile menu should not be visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).not.toBeVisible();
    
    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Desktop nav should be hidden
    await expect(desktopNav).not.toBeVisible();
    
    // Mobile menu button should be visible
    await expect(mobileMenuButton).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Test swipe gestures on theme cards
    await page.locator('[role="tab"]:has-text("Themes")').click();
    
    const themeCard = page.locator('[data-testid="theme-card-1"]');
    await expect(themeCard).toBeVisible();
    
    // Simulate swipe
    const box = await themeCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 10, box.y + box.height / 2);
      await page.mouse.up();
    }
    
    await context.close();
  });

  test('should handle different orientations', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad landscape'],
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Check landscape layout
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeGreaterThan(viewportSize?.height || 0);
    
    // Switch to portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check portrait layout
    const newViewportSize = page.viewportSize();
    expect(newViewportSize?.height).toBeGreaterThan(newViewportSize?.width || 0);
    
    await context.close();
  });

  test('should scale text appropriately', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileHeading = page.locator('h1');
    const mobileFontSize = await mobileHeading.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopFontSize = await mobileHeading.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    // Desktop font should be larger
    expect(parseInt(desktopFontSize)).toBeGreaterThan(parseInt(mobileFontSize));
  });
});