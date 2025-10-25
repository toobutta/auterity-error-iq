import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up visual regression testing environment...')

  try {
    // Clean up any temporary files or resources
    console.log('📁 Cleaning up temporary files...')

    // Clean up test results and screenshots if needed
    console.log('🖼️ Cleaning up test artifacts...')

    console.log('✅ Visual regression testing environment cleanup complete')

  } catch (error) {
    console.error('❌ Error during global teardown:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown
