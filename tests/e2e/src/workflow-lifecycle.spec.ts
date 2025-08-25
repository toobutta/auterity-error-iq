import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { WorkflowBuilderPage } from "./pages/WorkflowBuilderPage";
import { testWorkflows } from "./fixtures/test-data";

test.describe("Workflow Lifecycle", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should create, execute, and monitor a simple workflow", async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    const builder = new WorkflowBuilderPage(page);

    // Step 1: Navigate to dashboard and create new workflow
    await dashboard.goto();
    await dashboard.waitForDashboardLoad();

    const initialWorkflowCount = await dashboard.getWorkflowCount();
    await dashboard.createNewWorkflow();

    // Step 2: Build the workflow
    await builder.createNewWorkflow(
      testWorkflows.simple.name,
      testWorkflows.simple.description,
    );

    // Add nodes to the canvas
    await builder.addNodeToCanvas("data_input", 100, 200);
    await builder.addNodeToCanvas("ai_process", 300, 200);
    await builder.addNodeToCanvas("output", 500, 200);

    // Configure each node
    await builder.configureNode(
      "data_input-1",
      testWorkflows.simple.steps[0].config,
    );
    await builder.configureNode(
      "ai_process-1",
      testWorkflows.simple.steps[1].config,
    );
    await builder.configureNode(
      "output-1",
      testWorkflows.simple.steps[2].config,
    );

    // Connect the nodes
    await builder.connectNodes("data_input-1", "ai_process-1");
    await builder.connectNodes("ai_process-1", "output-1");

    // Step 3: Validate and save the workflow
    const validationResult = await builder.validateWorkflow();
    expect(validationResult).toContain("Valid");

    await builder.saveWorkflow();

    // Step 4: Execute the workflow
    const executionResponse = await builder.runWorkflow();
    expect(executionResponse.status()).toBe(200);

    // Step 5: Verify workflow was created
    await dashboard.goto();
    const finalWorkflowCount = await dashboard.getWorkflowCount();
    expect(finalWorkflowCount).toBe(initialWorkflowCount + 1);

    // Check recent workflows list contains our new workflow
    const recentWorkflows = await dashboard.getRecentWorkflows();
    const createdWorkflow = recentWorkflows.find(
      (wf) => wf.name === testWorkflows.simple.name,
    );
    expect(createdWorkflow).toBeTruthy();
  });

  test("should handle complex workflow with branching logic", async ({
    page,
  }) => {
    const builder = new WorkflowBuilderPage(page);

    await builder.goto();
    await builder.createNewWorkflow(
      testWorkflows.complex.name,
      testWorkflows.complex.description,
    );

    // Create complex workflow structure
    await builder.addNodeToCanvas("data_input", 100, 200);
    await builder.addNodeToCanvas("condition", 300, 200);
    await builder.addNodeToCanvas("ai_process", 500, 150);
    await builder.addNodeToCanvas("notification", 500, 250);

    // Configure nodes
    for (let i = 0; i < testWorkflows.complex.steps.length; i++) {
      const step = testWorkflows.complex.steps[i];
      await builder.configureNode(`${step.type}-${i + 1}`, step.config);
    }

    // Connect nodes in complex pattern
    await builder.connectNodes("data_input-1", "condition-1");
    await builder.connectNodes("condition-1", "ai_process-1");
    await builder.connectNodes("condition-1", "notification-1");

    // Validate complex workflow
    const validationResult = await builder.validateWorkflow();
    expect(validationResult).toContain("Valid");

    await builder.saveWorkflow();
  });

  test("should prevent execution of invalid workflows", async ({ page }) => {
    const builder = new WorkflowBuilderPage(page);

    await builder.goto();
    await builder.createNewWorkflow(
      "Invalid Workflow",
      "A workflow with missing connections",
    );

    // Add disconnected nodes
    await builder.addNodeToCanvas("data_input", 100, 200);
    await builder.addNodeToCanvas("ai_process", 300, 200);
    // Intentionally don't connect them

    // Try to validate
    const validationResult = await builder.validateWorkflow();
    expect(validationResult).toContain("Invalid");

    // Run button should be disabled or show error
    await expect(builder.runButton).toBeDisabled();
  });

  test("should display workflow execution progress", async ({ page }) => {
    const builder = new WorkflowBuilderPage(page);

    await builder.goto();
    await builder.createNewWorkflow(
      "Progress Test",
      "Test workflow execution progress",
    );

    // Create simple workflow
    await builder.addNodeToCanvas("data_input", 100, 200);
    await builder.addNodeToCanvas("ai_process", 300, 200);
    await builder.connectNodes("data_input-1", "ai_process-1");

    await builder.configureNode("data_input-1", {
      input_type: "text",
      value: "Test data",
    });
    await builder.configureNode("ai_process-1", {
      prompt: "Process this",
      model: "gpt-3.5-turbo",
    });

    await builder.saveWorkflow();

    // Execute and monitor progress
    await builder.runWorkflow();

    // Wait for execution progress indicators
    await expect(
      page.locator('[data-testid="execution-progress"]'),
    ).toBeVisible();

    // Check for completion
    await expect(
      page.locator('[data-testid="execution-complete"]'),
    ).toBeVisible({ timeout: 30000 });
  });
});
