/**
 * Template Manager for Industry Workflow Templates
 * Handles loading, importing, and managing workflow templates
 */

import { WorkflowDefinition } from '../types/workflow';

export interface IndustryWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  workflow: WorkflowDefinition;
  tags: string[];
  compliance: string[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Load all available industry workflow templates
 */
export async function loadIndustryTemplates(): Promise<IndustryWorkflowTemplate[]> {
  try {
    // In a real implementation, this would fetch from an API
    // For now, we'll load from local JSON files
    const templateFiles = [
      'automotive-lead-qualification.json',
      'healthcare-patient-intake.json'
    ];

    const templates: IndustryWorkflowTemplate[] = [];

    for (const file of templateFiles) {
      try {
        const response = await fetch(`/templates/industry-workflows/${file}`);
        if (response.ok) {
          const template = await response.json();
          templates.push(template);
        }
      } catch (error) {

      }
    }

    return templates;
  } catch (error) {

    return [];
  }
}

/**
 * Load templates by industry
 */
export async function loadTemplatesByIndustry(industry: string): Promise<IndustryWorkflowTemplate[]> {
  const allTemplates = await loadIndustryTemplates();
  return allTemplates.filter(template => template.industry === industry);
}

/**
 * Load templates by category
 */
export async function loadTemplatesByCategory(category: string): Promise<IndustryWorkflowTemplate[]> {
  const allTemplates = await loadIndustryTemplates();
  return allTemplates.filter(template => template.category === category);
}

/**
 * Search templates by tags or keywords
 */
export async function searchTemplates(query: string): Promise<IndustryWorkflowTemplate[]> {
  const allTemplates = await loadIndustryTemplates();
  const lowercaseQuery = query.toLowerCase();

  return allTemplates.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.industry.toLowerCase().includes(lowercaseQuery) ||
    template.category.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Import a template into a workflow
 */
export function importTemplateToWorkflow(template: IndustryWorkflowTemplate): WorkflowDefinition {
  return {
    name: `Copy of ${template.workflow.name}`,
    description: template.workflow.description,
    steps: template.workflow.steps,
    connections: template.workflow.connections,
    parameters: template.workflow.parameters || {}
  };
}

/**
 * Export a workflow as a template
 */
export function exportWorkflowAsTemplate(
  workflow: WorkflowDefinition,
  industry: string,
  category: string,
  tags: string[] = [],
  compliance: string[] = []
): IndustryWorkflowTemplate {
  return {
    id: `custom-${Date.now()}`,
    name: workflow.name,
    description: workflow.description || '',
    industry,
    category,
    workflow: {
      ...workflow,
      id: undefined // Remove ID for template
    },
    tags,
    compliance,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validate template structure
 */
export function validateTemplate(template: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.id || typeof template.id !== 'string') {
    errors.push('Template must have a valid id');
  }

  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template must have a valid name');
  }

  if (!template.industry || typeof template.industry !== 'string') {
    errors.push('Template must have a valid industry');
  }

  if (!template.workflow || typeof template.workflow !== 'object') {
    errors.push('Template must have a valid workflow object');
  }

  if (!template.workflow.steps || !Array.isArray(template.workflow.steps)) {
    errors.push('Template workflow must have steps array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get template categories and industries
 */
export async function getTemplateMetadata(): Promise<{
  industries: string[];
  categories: string[];
  compliance: string[];
}> {
  const templates = await loadIndustryTemplates();

  const industries = [...new Set(templates.map(t => t.industry))];
  const categories = [...new Set(templates.map(t => t.category))];
  const compliance = [...new Set(templates.flatMap(t => t.compliance))];

  return { industries, categories, compliance };
}


