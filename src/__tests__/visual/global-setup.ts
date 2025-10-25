import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up visual regression testing environment...')

  // Create a browser instance for setup tasks
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Pre-warm the application
    console.log('📦 Pre-warming application...')
    await page.goto(config.webServer?.url || 'http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Wait for critical components to load
    await page.waitForSelector('[data-testid="enhanced-canvas"]', {
      timeout: 10000
    })

    console.log('✅ Application pre-warmed successfully')

    // Clean up any existing test data
    console.log('🧹 Cleaning up test data...')
    await page.evaluate(() => {
      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()

      // Reset any global state
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, '/')
      }
    })

    console.log('✅ Test environment setup complete')

  } catch (error) {
    console.error('❌ Error during global setup:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
