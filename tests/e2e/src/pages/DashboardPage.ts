import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly workflowsCard: Locator;
  readonly templatesCard: Locator;
  readonly analyticsCard: Locator;
  readonly recentWorkflowsList: Locator;
  readonly createWorkflowButton: Locator;
  readonly browseTemplatesButton: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.workflowsCard = page.locator('[data-testid="workflows-card"]');
    this.templatesCard = page.locator('[data-testid="templates-card"]');
    this.analyticsCard = page.locator('[data-testid="analytics-card"]');
    this.recentWorkflowsList = page.locator('[data-testid="recent-workflows-list"]');
    this.createWorkflowButton = page.locator('[data-testid="create-workflow-btn"]');
    this.browseTemplatesButton = page.locator('[data-testid="browse-templates-btn"]');
    this.navigationMenu = page.locator('[data-testid="navigation-menu"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async getWorkflowCount() {
    const countElement = this.workflowsCard.locator('[data-testid="workflow-count"]');
    return parseInt(await countElement.textContent() || '0');
  }

  async getTemplateCount() {
    const countElement = this.templatesCard.locator('[data-testid="template-count"]');
    return parseInt(await countElement.textContent() || '0');
  }

  async navigateToWorkflows() {
    await this.navigationMenu.locator('a[href="/workflows"]').click();
    await this.page.waitForURL('**/workflows');
  }

  async navigateToTemplates() {
    await this.navigationMenu.locator('a[href="/templates"]').click();
    await this.page.waitForURL('**/templates');
  }

  async navigateToAnalytics() {
    await this.navigationMenu.locator('a[href="/analytics"]').click();
    await this.page.waitForURL('**/analytics');
  }

  async createNewWorkflow() {
    await this.createWorkflowButton.click();
    await this.page.waitForURL('**/workflows/builder');
  }

  async getRecentWorkflows() {
    const workflowItems = await this.recentWorkflowsList.locator('[data-testid="workflow-item"]').all();
    const workflows = [];
    
    for (const item of workflowItems) {
      const name = await item.locator('[data-testid="workflow-name"]').textContent();
      const status = await item.locator('[data-testid="workflow-status"]').textContent();
      const lastRun = await item.locator('[data-testid="workflow-last-run"]').textContent();
      
      workflows.push({ name, status, lastRun });
    }
    
    return workflows;
  }

  async waitForDashboardLoad() {
    await Promise.all([
      this.workflowsCard.waitFor({ state: 'visible' }),
      this.templatesCard.waitFor({ state: 'visible' }),
      this.analyticsCard.waitFor({ state: 'visible' })
    ]);
  }
}