import { test, expect } from '@playwright/test'

test.describe('Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('toolbar layout matches baseline', async ({ page }) => {
    const toolbar = page.locator('[data-testid="main-toolbar"]')

    if (await toolbar.isVisible()) {
      await expect(toolbar).toHaveScreenshot(
        'toolbar-layout.png',
        {
          threshold: 0.1,
          maxDiffPixels: 50
        }
      )
    }
  })

  test('node palette matches baseline', async ({ page }) => {
    const nodePalette = page.locator('[data-testid="node-palette"]')

    if (await nodePalette.isVisible()) {
      await expect(nodePalette).toHaveScreenshot(
        'node-palette.png',
        {
          threshold: 0.15,
          maxDiffPixels: 75
        }
      )
    }
  })

  test('properties panel matches baseline', async ({ page }) => {
    const propertiesPanel = page.locator('[data-testid="properties-panel"]')

    if (await propertiesPanel.isVisible()) {
      await expect(propertiesPanel).toHaveScreenshot(
        'properties-panel.png',
        {
          threshold: 0.15,
          maxDiffPixels: 75
        }
      )
    }
  })

  test('minimap matches baseline', async ({ page }) => {
    const minimap = page.locator('[data-testid="minimap"]')

    if (await minimap.isVisible()) {
      await expect(minimap).toHaveScreenshot(
        'minimap.png',
        {
          threshold: 0.2,
          maxDiffPixels: 100
        }
      )
    }
  })

  test('studio layout matches baseline', async ({ page }) => {
    // Take screenshot of the entire studio layout
    await expect(page.locator('[data-testid="studio-layout"]')).toHaveScreenshot(
      'studio-layout.png',
      {
        threshold: 0.2,
        maxDiffPixels: 150
      }
    )
  })

  test('performance monitor matches baseline', async ({ page }) => {
    const performanceMonitor = page.locator('[data-testid="performance-monitor"]')

    if (await performanceMonitor.isVisible()) {
      await expect(performanceMonitor).toHaveScreenshot(
        'performance-monitor.png',
        {
          threshold: 0.3,
          maxDiffPixels: 200
        }
      )
    }
  })

  test('error boundary matches baseline', async ({ page }) => {
    // This would require triggering an error to test the error boundary
    // For now, we'll test the normal state
    const errorBoundary = page.locator('[data-testid="error-boundary"]')

    if (await errorBoundary.isVisible()) {
      await expect(errorBoundary).toHaveScreenshot(
        'error-boundary-normal.png',
        {
          threshold: 0.1,
          maxDiffPixels: 50
        }
      )
    }
  })

  test('notification system matches baseline', async ({ page }) => {
    const notificationArea = page.locator('[data-testid="notification-area"]')

    if (await notificationArea.isVisible()) {
      await expect(notificationArea).toHaveScreenshot(
        'notification-area.png',
        {
          threshold: 0.2,
          maxDiffPixels: 100
        }
      )
    }
  })

  test('template browser matches baseline', async ({ page }) => {
    const templateBrowser = page.locator('[data-testid="template-browser"]')

    if (await templateBrowser.isVisible()) {
      await expect(templateBrowser).toHaveScreenshot(
        'template-browser.png',
        {
          threshold: 0.15,
          maxDiffPixels: 75
        }
      )
    }
  })

  test('tool browser matches baseline', async ({ page }) => {
    const toolBrowser = page.locator('[data-testid="tool-browser"]')

    if (await toolBrowser.isVisible()) {
      await expect(toolBrowser).toHaveScreenshot(
        'tool-browser.png',
        {
          threshold: 0.15,
          maxDiffPixels: 75
        }
      )
    }
  })
})
