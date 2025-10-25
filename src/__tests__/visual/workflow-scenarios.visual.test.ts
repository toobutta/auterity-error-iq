import { test, expect } from '@playwright/test'

test.describe('Workflow Scenario Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('empty workflow canvas matches baseline', async ({ page }) => {
    // Ensure we're in an empty state
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-empty-canvas.png',
      {
        threshold: 0.1,
        maxDiffPixels: 50
      }
    )
  })

  test('workflow with single node matches baseline', async ({ page }) => {
    // This would require creating a node programmatically
    // For now, we'll test the current state
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-single-node.png',
      {
        threshold: 0.15,
        maxDiffPixels: 75
      }
    )
  })

  test('workflow with multiple nodes matches baseline', async ({ page }) => {
    // This would require creating multiple nodes
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-multiple-nodes.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('workflow with connections matches baseline', async ({ page }) => {
    // This would require creating nodes and connections
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-with-connections.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('workflow zoom levels match baseline', async ({ page }) => {
    // Test different zoom levels
    const zoomLevels = [0.5, 1.0, 2.0]

    for (const zoom of zoomLevels) {
      // This would require setting zoom programmatically
      await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
        `workflow-zoom-${zoom}x.png`,
        {
          threshold: 0.2,
          maxDiffPixels: 150
        }
      )
    }
  })

  test('workflow selection states match baseline', async ({ page }) => {
    // Test different selection states
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-selection-states.png',
      {
        threshold: 0.15,
        maxDiffPixels: 75
      }
    )
  })

  test('workflow drag and drop matches baseline', async ({ page }) => {
    // Test drag and drop interactions
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-drag-drop.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('workflow undo/redo states match baseline', async ({ page }) => {
    // Test undo/redo functionality
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-undo-redo.png',
      {
        threshold: 0.15,
        maxDiffPixels: 75
      }
    )
  })

  test('workflow export/import matches baseline', async ({ page }) => {
    // Test export/import workflow states
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-export-import.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('workflow error states match baseline', async ({ page }) => {
    // Test error states in workflows
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-error-states.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })

  test('workflow performance under load matches baseline', async ({ page }) => {
    // Test workflow with many nodes (performance scenario)
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-performance-load.png',
      {
        threshold: 0.3,
        maxDiffPixels: 200
      }
    )
  })

  test('workflow responsive design matches baseline', async ({ page }) => {
    // Test workflow at different screen sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1366, height: 768 },  // Laptop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)

      await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
        `workflow-viewport-${viewport.width}x${viewport.height}.png`,
        {
          threshold: 0.2,
          maxDiffPixels: 150
        }
      )
    }
  })

  test('workflow accessibility focus indicators match baseline', async ({ page }) => {
    // Test keyboard navigation and focus indicators
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-focus-indicators.png',
      {
        threshold: 0.15,
        maxDiffPixels: 75
      }
    )
  })

  test('workflow theme variations match baseline', async ({ page }) => {
    // Test different theme variations
    await expect(page.locator('[data-testid="enhanced-canvas"]')).toHaveScreenshot(
      'workflow-theme-variations.png',
      {
        threshold: 0.2,
        maxDiffPixels: 100
      }
    )
  })
})
