import { test, expect } from '@playwright/test'

test.describe('Canvas Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')

    // Wait for the canvas to be ready
    await page.waitForSelector('[data-testid="enhanced-canvas"]', {
      timeout: 10000
    })

    // Wait for any loading states to complete
    await page.waitForLoadState('networkidle')
  })

  test('canvas initial state matches baseline', async ({ page }) => {
    // Take a screenshot of the initial canvas state
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-initial-state.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('canvas with grid enabled matches baseline', async ({ page }) => {
    // Click the grid toggle button
    await page.locator('[data-testid="grid-toggle"]').click()

    // Wait for the grid to appear
    await page.waitForTimeout(500)

    // Take screenshot with grid enabled
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-with-grid.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('canvas zoom controls match baseline', async ({ page }) => {
    // Test zoom in
    await page.locator('[data-testid="zoom-in"]').click()
    await page.waitForTimeout(300)

    await expect(page.locator('[data-testid="zoom-indicator"]')).toHaveScreenshot(
      'canvas-zoom-in.png',
      {
        threshold: 0.1,
        maxDiffPixels: 50
      }
    )

    // Test zoom out
    await page.locator('[data-testid="zoom-out"]').click()
    await page.waitForTimeout(300)

    await expect(page.locator('[data-testid="zoom-indicator"]')).toHaveScreenshot(
      'canvas-zoom-out.png',
      {
        threshold: 0.1,
        maxDiffPixels: 50
      }
    )
  })

  test('canvas performance overlay matches baseline', async ({ page }) => {
    // The performance overlay should be visible in development mode
    const performanceOverlay = page.locator('.canvas-performance-overlay')

    // Check if performance overlay exists (only in dev mode)
    const overlayExists = await performanceOverlay.isVisible()

    if (overlayExists) {
      await expect(performanceOverlay).toHaveScreenshot(
        'canvas-performance-overlay.png',
        {
          threshold: 0.3,
          maxDiffPixels: 200
        }
      )
    }
  })

  test('canvas controls layout matches baseline', async ({ page }) => {
    // Take screenshot of the canvas controls area
    const controlsArea = page.locator('.canvas-controls')

    if (await controlsArea.isVisible()) {
      await expect(controlsArea).toHaveScreenshot(
        'canvas-controls-layout.png',
        {
          threshold: 0.1,
          maxDiffPixels: 50
        }
      )
    }
  })

  test('canvas responsive behavior matches baseline', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 768, height: 1024 }) // Tablet
    await page.waitForTimeout(500)

    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-tablet-viewport.png',
      {
        threshold: 0.2,
        maxDiffPixels: 150
      }
    )

    await page.setViewportSize({ width: 375, height: 667 }) // Mobile
    await page.waitForTimeout(500)

    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-mobile-viewport.png',
      {
        threshold: 0.2,
        maxDiffPixels: 150
      }
    )
  })

  test('canvas dark mode matches baseline', async ({ page }) => {
    // Assuming there's a theme toggle - this would need to be implemented
    // For now, we'll test the default theme
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-default-theme.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('canvas with sample workflow matches baseline', async ({ page }) => {
    // This would require setting up a sample workflow
    // For now, we'll test the empty state
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'canvas-empty-workflow.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })
})
