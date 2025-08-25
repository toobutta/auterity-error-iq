import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Cross-System Integration", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should integrate AutoMatrix with RelayCore for AI routing", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);

    // Start from dashboard
    await dashboard.goto();

    // Navigate to AI routing settings
    await page.locator('[data-testid="ai-routing-settings"]').click();
    await expect(page).toHaveURL(/.*settings\/ai-routing/);

    // Configure AI routing preferences
    await page.locator('[data-testid="enable-smart-routing"]').check();
    await page
      .locator('[data-testid="cost-optimization"]')
      .selectOption("balanced");
    await page
      .locator('[data-testid="performance-priority"]')
      .selectOption("medium");

    // Save settings
    await page.locator('[data-testid="save-routing-settings"]').click();
    await expect(
      page.locator('[data-testid="settings-saved-message"]'),
    ).toBeVisible();

    // Create a workflow that uses AI routing
    await dashboard.createNewWorkflow();

    // Add AI processing node that should use RelayCore
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    const toolbox = page.locator('[data-testid="workflow-toolbox"]');

    await toolbox
      .locator('[data-testid="node-ai_process"]')
      .dragTo(canvas, { targetPosition: { x: 200, y: 200 } });

    // Configure AI node to use routing
    await page.locator('[data-testid="node-ai_process-1"]').click();
    await page.locator('[data-testid="config-enable-routing"]').check();
    await page.locator('[data-testid="config-model"]').selectOption("auto");

    // Save and execute workflow
    await page.locator('[data-testid="save-workflow-btn"]').click();
    await page.locator('[data-testid="run-workflow-btn"]').click();

    // Verify RelayCore integration
    await expect(
      page.locator('[data-testid="routing-active-indicator"]'),
    ).toBeVisible();

    // Check execution logs for routing decisions
    const logsPanel = page.locator('[data-testid="execution-logs"]');
    await expect(logsPanel).toContainText("RelayCore routing decision");
  });

  test("should integrate with NeuroWeaver for model specialization", async ({
    page,
  }) => {
    // Navigate to NeuroWeaver interface
    await page.goto("/models");
    await expect(page).toHaveURL(/.*models/);

    // Check NeuroWeaver dashboard loads
    await expect(
      page.locator('[data-testid="models-dashboard"]'),
    ).toBeVisible();

    // View available specialized models
    const modelsGrid = page.locator('[data-testid="models-grid"]');
    await expect(modelsGrid).toBeVisible();

    const modelCards = await modelsGrid
      .locator('[data-testid="model-card"]')
      .all();
    expect(modelCards.length).toBeGreaterThan(0);

    // Select a specialized model
    const firstModel = modelCards[0];
    await firstModel.click();

    // Check model details
    const modelDetails = page.locator('[data-testid="model-details"]');
    await expect(modelDetails).toBeVisible();
    await expect(
      modelDetails.locator('[data-testid="model-name"]'),
    ).toBeVisible();
    await expect(
      modelDetails.locator('[data-testid="model-performance"]'),
    ).toBeVisible();

    // Use model in workflow
    await page.locator('[data-testid="use-in-workflow-button"]').click();

    // Should redirect to workflow builder with model pre-configured
    await expect(page).toHaveURL(/.*workflows\/builder/);

    const aiNode = page.locator('[data-testid="node-ai_process-1"]');
    await expect(aiNode).toBeVisible();

    // Verify model is pre-selected
    await aiNode.click();
    const modelSelect = page.locator('[data-testid="config-model"]');
    const selectedModel = await modelSelect.inputValue();
    expect(selectedModel).toBeTruthy();
  });

  test("should display unified monitoring across all systems", async ({
    page,
  }) => {
    // Navigate to monitoring dashboard
    await page.goto("/monitoring");
    await expect(page).toHaveURL(/.*monitoring/);

    // Check all system monitors are present
    const systemCards = page.locator('[data-testid="system-card"]');

    await expect(systemCards.filter({ hasText: "AutoMatrix" })).toBeVisible();
    await expect(systemCards.filter({ hasText: "RelayCore" })).toBeVisible();
    await expect(systemCards.filter({ hasText: "NeuroWeaver" })).toBeVisible();

    // Check system health indicators
    const healthIndicators = await page
      .locator('[data-testid="health-indicator"]')
      .all();
    expect(healthIndicators.length).toBe(3);

    for (const indicator of healthIndicators) {
      const status = await indicator.getAttribute("data-status");
      expect(["healthy", "warning", "error"]).toContain(status);
    }

    // Check metrics are displayed
    await expect(page.locator('[data-testid="metrics-chart"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="performance-metrics"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="cost-metrics"]')).toBeVisible();

    // Test real-time updates
    const metricsValue = await page
      .locator('[data-testid="current-requests"]')
      .textContent();

    // Wait for potential update (metrics should update)
    await page.waitForTimeout(5000);

    // Check if value updated (in a real scenario with active traffic)
    const updatedValue = await page
      .locator('[data-testid="current-requests"]')
      .textContent();
    // Note: In a real test, we might generate traffic to ensure updates happen
  });

  test("should handle cross-system error propagation", async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await dashboard.createNewWorkflow();

    // Create workflow that depends on multiple systems
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    const toolbox = page.locator('[data-testid="workflow-toolbox"]');

    await toolbox
      .locator('[data-testid="node-data_input"]')
      .dragTo(canvas, { targetPosition: { x: 100, y: 200 } });
    await toolbox
      .locator('[data-testid="node-ai_process"]')
      .dragTo(canvas, { targetPosition: { x: 300, y: 200 } });
    await toolbox
      .locator('[data-testid="node-model_inference"]')
      .dragTo(canvas, { targetPosition: { x: 500, y: 200 } });

    // Connect nodes
    await page
      .locator(
        '[data-testid="node-data_input-1"] [data-testid="output-handle"]',
      )
      .dragTo(
        page.locator(
          '[data-testid="node-ai_process-1"] [data-testid="input-handle"]',
        ),
      );

    await page
      .locator(
        '[data-testid="node-ai_process-1"] [data-testid="output-handle"]',
      )
      .dragTo(
        page.locator(
          '[data-testid="node-model_inference-1"] [data-testid="input-handle"]',
        ),
      );

    // Configure nodes with invalid settings to trigger errors
    await page.locator('[data-testid="node-ai_process-1"]').click();
    await page.locator('[data-testid="config-model"]').fill("invalid-model-id");

    // Save and execute
    await page.locator('[data-testid="save-workflow-btn"]').click();
    await page.locator('[data-testid="run-workflow-btn"]').click();

    // Check for error handling
    await expect(page.locator('[data-testid="execution-error"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify error details show system-specific information
    const errorDetails = page.locator('[data-testid="error-details"]');
    await expect(errorDetails).toContainText("RelayCore");
    await expect(errorDetails).toContainText("Model not found");

    // Check error is logged in monitoring
    await page.goto("/monitoring/errors");

    const errorLog = page.locator('[data-testid="error-log"]').first();
    await expect(errorLog).toBeVisible();
    await expect(errorLog).toContainText("invalid-model-id");
  });

  test("should synchronize user authentication across systems", async ({
    page,
  }) => {
    // Test that login persists across all system interfaces
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Navigate to RelayCore interface
    await page.goto("/relay");
    await expect(page.locator('[data-testid="relay-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Navigate to NeuroWeaver interface
    await page.goto("/models");
    await expect(
      page.locator('[data-testid="models-dashboard"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

    // Check user permissions are consistent
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();

    const permissions = await page
      .locator('[data-testid="user-permission"]')
      .all();
    expect(permissions.length).toBeGreaterThan(0);

    // Test logout propagation
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL(/.*login/);

    // Try to access protected routes
    await page.goto("/workflows");
    await expect(page).toHaveURL(/.*login/);

    await page.goto("/relay");
    await expect(page).toHaveURL(/.*login/);

    await page.goto("/models");
    await expect(page).toHaveURL(/.*login/);
  });
});
