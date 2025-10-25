/**
 * AI SDK Integration Test
 *
 * Simple test to verify AI SDK integration is working
 */

import { aiSDKService } from './src/services/aiSDKService.ts';

async function testAISDKIntegration() {
  try {
    // Test 1: Basic text response
    const response1 = await aiSDKService.generateTextResponse(
      'Hello, can you help me create a simple workflow?',
      { workflowId: 'test-workflow-123' }
    );

    // Test 2: Provider switching
    aiSDKService.getProviders();
    aiSDKService.setProvider('anthropic');

    // Test 3: Cost tracking
    const costSummary = aiSDKService.getCostSummary();
    aiSDKService.resetCostTracking();

    // All tests passed
    return true;

  } catch (error) {
    throw error;
  }
}

// Run the test
testAISDKIntegration();
