import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { WorkflowBuilderPage } from "./pages/WorkflowBuilderPage";
import { testTemplates } from "./fixtures/test-data";

test.describe("Template Integration", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should browse and preview available templates", async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await dashboard.navigateToTemplates();

    // Check templates page loads
    await expect(page.locator('[data-testid="templates-grid"]')).toBeVisible();

    // Check for template categories
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await categoryFilter.click();

    const categories = await page
      .locator('[data-testid="category-option"]')
      .all();
    expect(categories.length).toBeGreaterThan(0);

    // Preview a template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    await firstTemplate.locator('[data-testid="preview-button"]').click();

    // Check preview modal
    const previewModal = page.locator('[data-testid="template-preview-modal"]');
    await expect(previewModal).toBeVisible();

    await expect(
      previewModal.locator('[data-testid="template-name"]'),
    ).toBeVisible();
    await expect(
      previewModal.locator('[data-testid="template-description"]'),
    ).toBeVisible();
    await expect(
      previewModal.locator('[data-testid="template-workflow"]'),
    ).toBeVisible();
  });

  test("should instantiate template with parameters", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const builder = new WorkflowBuilderPage(page);

    await dashboard.goto();
    await dashboard.navigateToTemplates();

    // Find and use customer support template
    const templateCard = page
      .locator('[data-testid="template-card"]')
      .filter({ hasText: "Customer Support" })
      .first();

    await templateCard.locator('[data-testid="use-template-button"]').click();

    // Fill template parameters
    const parameterForm = page.locator(
      '[data-testid="template-parameters-form"]',
    );
    await expect(parameterForm).toBeVisible();

    // Fill required parameters
    await page
      .locator('[data-testid="param-company-name"]')
      .fill("Test Company");
    await page
      .locator('[data-testid="param-support-email"]')
      .fill("support@testcompany.com");
    await page.locator('[data-testid="param-response-time"]').fill("24");

    // Create workflow from template
    await page.locator('[data-testid="create-from-template-button"]').click();

    // Verify we're in the builder with template-created workflow
    await expect(page).toHaveURL(/.*workflows\/builder/);

    // Check that nodes are pre-populated
    const nodes = await builder.getWorkflowNodes();
    expect(nodes.length).toBeGreaterThan(0);

    // Verify template parameters were applied
    await builder.selectNode("notification-1");
    const emailField = page.locator('[data-testid="config-recipient"]');
    await expect(emailField).toHaveValue("support@testcompany.com");
  });

  test("should validate template parameters", async ({ page }) => {
    await page.goto("/templates");

    const templateCard = page.locator('[data-testid="template-card"]').first();
    await templateCard.locator('[data-testid="use-template-button"]').click();

    const parameterForm = page.locator(
      '[data-testid="template-parameters-form"]',
    );
    await expect(parameterForm).toBeVisible();

    // Try to submit without required parameters
    const createButton = page.locator(
      '[data-testid="create-from-template-button"]',
    );
    await createButton.click();

    // Check validation errors
    const validationErrors = page.locator('[data-testid="validation-error"]');
    await expect(validationErrors).toBeVisible();

    // Fill invalid email format
    await page
      .locator('[data-testid="param-support-email"]')
      .fill("invalid-email");
    await createButton.click();

    const emailError = page.locator('[data-testid="email-validation-error"]');
    await expect(emailError).toBeVisible();
  });

  test("should search and filter templates", async ({ page }) => {
    await page.goto("/templates");

    // Test search functionality
    const searchInput = page.locator('[data-testid="template-search"]');
    await searchInput.fill("customer");

    // Wait for search results
    await page.waitForTimeout(1000);

    const searchResults = await page
      .locator('[data-testid="template-card"]')
      .all();
    expect(searchResults.length).toBeGreaterThan(0);

    // Verify search results contain search term
    for (const result of searchResults) {
      const text = await result.textContent();
      expect(text?.toLowerCase()).toContain("customer");
    }

    // Test category filter
    await searchInput.clear();

    const categoryFilter = page.locator('[data-testid="category-filter"]');
    await categoryFilter.selectOption("support");

    const filteredResults = await page
      .locator('[data-testid="template-card"]')
      .all();

    // Verify filtered results are from support category
    for (const result of filteredResults) {
      const category = await result
        .locator('[data-testid="template-category"]')
        .textContent();
      expect(category).toBe("support");
    }
  });

  test("should handle template creation workflow", async ({ page }) => {
    const builder = new WorkflowBuilderPage(page);

    // Create a new workflow first
    await builder.goto();
    await builder.createNewWorkflow(
      "Custom Template",
      "A custom workflow to save as template",
    );

    // Build a simple workflow
    await builder.addNodeToCanvas("data_input", 100, 200);
    await builder.addNodeToCanvas("ai_process", 300, 200);
    await builder.connectNodes("data_input-1", "ai_process-1");

    await builder.saveWorkflow();

    // Save as template
    const saveTemplateButton = page.locator(
      '[data-testid="save-as-template-button"]',
    );
    await saveTemplateButton.click();

    const templateForm = page.locator('[data-testid="template-creation-form"]');
    await expect(templateForm).toBeVisible();

    // Fill template details
    await page
      .locator('[data-testid="template-name-input"]')
      .fill("My Custom Template");
    await page
      .locator('[data-testid="template-description-input"]')
      .fill("A custom template for testing");
    await page
      .locator('[data-testid="template-category-select"]')
      .selectOption("custom");

    // Add tags
    const tagInput = page.locator('[data-testid="template-tags-input"]');
    await tagInput.fill("custom,test");

    // Define template parameters
    const addParamButton = page.locator('[data-testid="add-parameter-button"]');
    await addParamButton.click();

    await page.locator('[data-testid="param-name-0"]').fill("input_text");
    await page.locator('[data-testid="param-type-0"]').selectOption("text");
    await page.locator('[data-testid="param-required-0"]').check();

    // Save template
    await page.locator('[data-testid="create-template-button"]').click();

    // Verify template was created
    await expect(
      page.locator('[data-testid="template-success-message"]'),
    ).toBeVisible();

    // Navigate to templates and verify it's there
    await page.goto("/templates");
    const customTemplate = page
      .locator('[data-testid="template-card"]')
      .filter({ hasText: "My Custom Template" });

    await expect(customTemplate).toBeVisible();
  });
});
