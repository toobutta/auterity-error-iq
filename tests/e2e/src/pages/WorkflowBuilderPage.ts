import { Page, Locator } from '@playwright/test';

export class WorkflowBuilderPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly toolbox: Locator;
  readonly saveButton: Locator;
  readonly runButton: Locator;
  readonly workflowNameInput: Locator;
  readonly workflowDescriptionInput: Locator;
  readonly nodePanel: Locator;
  readonly propertiesPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('[data-testid="workflow-canvas"]');
    this.toolbox = page.locator('[data-testid="workflow-toolbox"]');
    this.saveButton = page.locator('[data-testid="save-workflow-btn"]');
    this.runButton = page.locator('[data-testid="run-workflow-btn"]');
    this.workflowNameInput = page.locator('[data-testid="workflow-name-input"]');
    this.workflowDescriptionInput = page.locator('[data-testid="workflow-description-input"]');
    this.nodePanel = page.locator('[data-testid="node-panel"]');
    this.propertiesPanel = page.locator('[data-testid="properties-panel"]');
  }

  async goto() {
    await this.page.goto('/workflows/builder');
    await this.page.waitForLoadState('networkidle');
  }

  async createNewWorkflow(name: string, description?: string) {
    await this.workflowNameInput.fill(name);
    if (description) {
      await this.workflowDescriptionInput.fill(description);
    }
  }

  async addNodeToCanvas(nodeType: string, x = 200, y = 200) {
    const nodeButton = this.toolbox.locator(`[data-testid="node-${nodeType}"]`);
    await nodeButton.dragTo(this.canvas, { targetPosition: { x, y } });
  }

  async connectNodes(sourceNodeId: string, targetNodeId: string) {
    const sourceNode = this.canvas.locator(`[data-testid="node-${sourceNodeId}"]`);
    const targetNode = this.canvas.locator(`[data-testid="node-${targetNodeId}"]`);
    
    const sourceHandle = sourceNode.locator('[data-testid="output-handle"]');
    const targetHandle = targetNode.locator('[data-testid="input-handle"]');
    
    await sourceHandle.dragTo(targetHandle);
  }

  async selectNode(nodeId: string) {
    const node = this.canvas.locator(`[data-testid="node-${nodeId}"]`);
    await node.click();
    await this.page.waitForTimeout(500); // Wait for properties panel to update
  }

  async configureNode(nodeId: string, config: Record<string, any>) {
    await this.selectNode(nodeId);
    
    for (const [key, value] of Object.entries(config)) {
      const input = this.propertiesPanel.locator(`[data-testid="config-${key}"]`);
      await input.fill(String(value));
    }
  }

  async saveWorkflow() {
    await this.saveButton.click();
    await this.page.waitForResponse(response => 
      response.url().includes('/api/workflows') && response.status() === 201
    );
  }

  async runWorkflow() {
    await this.runButton.click();
    return this.page.waitForResponse(response => 
      response.url().includes('/execute') && response.status() === 200
    );
  }

  async validateWorkflow() {
    const validateButton = this.page.locator('[data-testid="validate-workflow-btn"]');
    await validateButton.click();
    
    // Wait for validation to complete
    await this.page.waitForSelector('[data-testid="validation-result"]');
    
    return this.page.locator('[data-testid="validation-result"]').textContent();
  }

  async getWorkflowNodes() {
    const nodes = await this.canvas.locator('[data-testid^="node-"]').all();
    const nodeData = [];
    
    for (const node of nodes) {
      const id = await node.getAttribute('data-testid');
      const position = await node.boundingBox();
      nodeData.push({ id, position });
    }
    
    return nodeData;
  }

  async getWorkflowConnections() {
    const connections = await this.canvas.locator('[data-testid^="edge-"]').all();
    const connectionData = [];
    
    for (const connection of connections) {
      const id = await connection.getAttribute('data-testid');
      connectionData.push({ id });
    }
    
    return connectionData;
  }
}