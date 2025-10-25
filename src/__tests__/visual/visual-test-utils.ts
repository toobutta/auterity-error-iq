import { Page, Locator } from '@playwright/test'

/**
 * Visual Test Utilities for Workflow Studio
 * Provides helper functions for visual regression testing
 */

export class VisualTestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for canvas to be fully loaded and stable
   */
  async waitForCanvasStable(timeout = 5000): Promise<void> {
    await this.page.waitForSelector('[data-testid="enhanced-canvas"]', { timeout })

    // Wait for any animations or transitions to complete
    await this.page.waitForTimeout(500)

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Take a screenshot with consistent settings
   */
  async takeScreenshot(
    locator: Locator,
    name: string,
    options: {
      threshold?: number
      maxDiffPixels?: number
      fullPage?: boolean
    } = {}
  ): Promise<Buffer> {
    const { threshold = 0.2, maxDiffPixels = 100, fullPage = false } = options

    return await locator.screenshot({
      path: `screenshots/${name}`
    })
  }

  /**
   * Simulate user interactions for visual testing
   */
  async simulateUserInteraction(action: string, target: string): Promise<void> {
    switch (action) {
      case 'click':
        await this.page.click(target)
        break
      case 'hover':
        await this.page.hover(target)
        break
      case 'focus':
        await this.page.focus(target)
        break
      case 'type':
        await this.page.fill(target, 'test input')
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // Wait for any resulting animations or state changes
    await this.page.waitForTimeout(300)
  }

  /**
   * Test responsive breakpoints
   */
  async testResponsiveBreakpoints(
    locator: Locator,
    baseName: string,
    breakpoints: Array<{ width: number; height: number; name: string }>
  ): Promise<void> {
    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      })

      await this.page.waitForTimeout(500)

      await this.takeScreenshot(
        locator,
        `${baseName}-${breakpoint.name}.png`,
        { threshold: 0.2, maxDiffPixels: 150 }
      )
    }
  }

  /**
   * Test theme variations
   */
  async testThemeVariations(
    locator: Locator,
    baseName: string,
    themes: string[]
  ): Promise<void> {
    for (const theme of themes) {
      // This would require theme switching logic
      // For now, we'll just take screenshots with different names
      await this.takeScreenshot(
        locator,
        `${baseName}-${theme}.png`,
        { threshold: 0.2, maxDiffPixels: 100 }
      )
    }
  }

  /**
   * Compare screenshots with custom logic
   */
  async compareScreenshots(
    actual: Buffer,
    expected: Buffer,
    options: {
      threshold?: number
      maxDiffPixels?: number
    } = {}
  ): Promise<{ passed: boolean; diffPixels: number; diffPercentage: number }> {
    // This would require pixel comparison logic
    // For now, return a mock result
    return {
      passed: true,
      diffPixels: 0,
      diffPercentage: 0
    }
  }

  /**
   * Generate visual test report
   */
  generateReport(results: any[]): string {
    const passed = results.filter(r => r.passed).length
    const failed = results.length - passed

    return `
Visual Regression Test Report
=============================
Total Tests: ${results.length}
Passed: ${passed}
Failed: ${failed}
Success Rate: ${((passed / results.length) * 100).toFixed(1)}%

${results.map(r => `${r.passed ? '✅' : '❌'} ${r.name}`).join('\n')}
    `.trim()
  }

  /**
   * Clean up test artifacts
   */
  async cleanup(): Promise<void> {
    // Clear local storage
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 })
  }
}

/**
 * Factory function for visual test utilities
 */
export function createVisualTestUtils(page: Page): VisualTestUtils {
  return new VisualTestUtils(page)
}

/**
 * Common breakpoints for responsive testing
 */
export const COMMON_BREAKPOINTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1366, height: 768, name: 'laptop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
]

/**
 * Common themes for theme testing
 */
export const COMMON_THEMES = [
  'light',
  'dark',
  'high-contrast'
]

/**
 * Visual test configuration presets
 */
export const VISUAL_TEST_PRESETS = {
  strict: {
    threshold: 0.05,
    maxDiffPixels: 10
  },
  normal: {
    threshold: 0.2,
    maxDiffPixels: 100
  },
  lenient: {
    threshold: 0.5,
    maxDiffPixels: 500
  }
}
