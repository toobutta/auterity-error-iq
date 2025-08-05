/**
 * Model Selection Explainer
 * 
 * This utility provides functions for explaining model selection decisions
 * and generating visualizations of the selection process.
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { createLogger } from './logger';

const logger = createLogger('model-selection-explainer');

/**
 * Selection decision factors
 */
interface SelectionFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

/**
 * Model comparison data
 */
interface ModelComparison {
  modelId: string;
  provider: string;
  qualityScore: number;
  cost: {
    amount: number;
    currency: string;
  };
  factors: SelectionFactor[];
  totalScore: number;
  selected: boolean;
}

/**
 * Selection explanation
 */
export interface SelectionExplanation {
  id: string;
  requestId: string;
  timestamp: string;
  selectedModel: string;
  originalModel?: string;
  budgetStatus?: string;
  budgetPriority?: string;
  qualityRequirement?: string;
  factors: {
    cost: number;
    quality: number;
    budget: number;
    preference: number;
  };
  comparisons: ModelComparison[];
  reasoning: string;
  visualizationData: any;
}

/**
 * Generate explanation for model selection
 */
export async function generateExplanation(
  requestId: string,
  selectedModel: string,
  originalModel: string | undefined,
  alternatives: any[],
  budgetStatus: any,
  budgetPriority: string,
  qualityRequirement: string,
  modelOptions: any[]
): Promise<SelectionExplanation> {
  try {
    logger.info(`Generating explanation for request ${requestId}`);
    
    // Calculate factor weights
    const factors = calculateFactorWeights(budgetPriority, budgetStatus?.status, qualityRequirement);
    
    // Generate model comparisons
    const comparisons = generateModelComparisons(
      selectedModel,
      modelOptions,
      factors,
      budgetStatus
    );
    
    // Generate reasoning text
    const reasoning = generateReasoning(
      selectedModel,
      originalModel,
      alternatives,
      budgetStatus,
      budgetPriority,
      qualityRequirement,
      comparisons
    );
    
    // Generate visualization data
    const visualizationData = generateVisualizationData(comparisons, factors);
    
    // Create explanation object
    const explanation: SelectionExplanation = {
      id: uuidv4(),
      requestId,
      timestamp: new Date().toISOString(),
      selectedModel,
      originalModel,
      budgetStatus: budgetStatus?.status,
      budgetPriority,
      qualityRequirement,
      factors: {
        cost: factors.costWeight,
        quality: factors.qualityWeight,
        budget: factors.budgetWeight,
        preference: factors.preferenceWeight
      },
      comparisons,
      reasoning,
      visualizationData
    };
    
    // Store explanation in database
    await storeExplanation(explanation);
    
    return explanation;
  } catch (error) {
    logger.error(`Error generating explanation for request ${requestId}:`, error);
    throw error;
  }
}

/**
 * Calculate factor weights based on budget priority and status
 */
function calculateFactorWeights(
  budgetPriority: string,
  budgetStatus: string | undefined,
  qualityRequirement: string
): {
  costWeight: number;
  qualityWeight: number;
  budgetWeight: number;
  preferenceWeight: number;
} {
  // Base weights
  let costWeight: number;
  let qualityWeight: number;
  let budgetWeight = 0.1;
  let preferenceWeight = 0.1;
  
  // Set base weights based on budget priority
  switch (budgetPriority) {
    case 'cost-saving':
      costWeight = 0.5;
      qualityWeight = 0.3;
      break;
    case 'quality-first':
      costWeight = 0.3;
      qualityWeight = 0.5;
      break;
    case 'balanced':
    default:
      costWeight = 0.4;
      qualityWeight = 0.4;
  }
  
  // Adjust weights based on budget status
  if (budgetStatus === 'warning') {
    costWeight += 0.05;
    qualityWeight -= 0.05;
    budgetWeight += 0.05;
  } else if (budgetStatus === 'critical') {
    costWeight += 0.1;
    qualityWeight -= 0.1;
    budgetWeight += 0.1;
  } else if (budgetStatus === 'exceeded') {
    costWeight += 0.15;
    qualityWeight -= 0.15;
    budgetWeight += 0.15;
    preferenceWeight -= 0.05;
  }
  
  // Adjust weights based on quality requirement
  switch (qualityRequirement) {
    case 'maximum':
      qualityWeight += 0.05;
      costWeight -= 0.05;
      break;
    case 'high':
      qualityWeight += 0.025;
      costWeight -= 0.025;
      break;
    case 'minimum':
      qualityWeight -= 0.05;
      costWeight += 0.05;
      break;
  }
  
  // Normalize weights to ensure they sum to 1
  const totalWeight = costWeight + qualityWeight + budgetWeight + preferenceWeight;
  costWeight /= totalWeight;
  qualityWeight /= totalWeight;
  budgetWeight /= totalWeight;
  preferenceWeight /= totalWeight;
  
  return {
    costWeight,
    qualityWeight,
    budgetWeight,
    preferenceWeight
  };
}

/**
 * Generate model comparisons
 */
function generateModelComparisons(
  selectedModel: string,
  modelOptions: any[],
  factors: {
    costWeight: number;
    qualityWeight: number;
    budgetWeight: number;
    preferenceWeight: number;
  },
  budgetStatus: any
): ModelComparison[] {
  // Find the maximum cost for normalization
  const maxCost = Math.max(...modelOptions.map(option => option.estimatedCost.totalCost));
  
  // Generate comparisons
  return modelOptions.map(option => {
    // Calculate normalized scores
    const costScore = maxCost > 0 ? 1 - (option.estimatedCost.totalCost / maxCost) : 1;
    const qualityScore = option.qualityScore / 100;
    
    // Calculate budget impact score
    let budgetScore = 1;
    if (budgetStatus && budgetStatus.remaining > 0) {
      const percentOfRemaining = (option.estimatedCost.totalCost / budgetStatus.remaining) * 100;
      budgetScore = Math.max(0, 1 - (percentOfRemaining / 100));
    }
    
    // Calculate preference score (1 if this is the selected model, 0 otherwise)
    const preferenceScore = option.model === selectedModel ? 1 : 0;
    
    // Calculate factor scores
    const costFactor: SelectionFactor = {
      name: 'Cost',
      weight: factors.costWeight,
      score: costScore,
      description: `${costScore.toFixed(2)} (${option.estimatedCost.totalCost.toFixed(4)} ${option.estimatedCost.currency})`
    };
    
    const qualityFactor: SelectionFactor = {
      name: 'Quality',
      weight: factors.qualityWeight,
      score: qualityScore,
      description: `${qualityScore.toFixed(2)} (${option.qualityScore}/100)`
    };
    
    const budgetFactor: SelectionFactor = {
      name: 'Budget Impact',
      weight: factors.budgetWeight,
      score: budgetScore,
      description: budgetStatus ? 
        `${budgetScore.toFixed(2)} (${option.estimatedCost.totalCost.toFixed(2)}/${budgetStatus.remaining.toFixed(2)})` : 
        'N/A'
    };
    
    const preferenceFactor: SelectionFactor = {
      name: 'Preference',
      weight: factors.preferenceWeight,
      score: preferenceScore,
      description: preferenceScore === 1 ? 'Preferred model' : 'Not preferred'
    };
    
    // Calculate total score
    const totalScore = 
      (costFactor.score * costFactor.weight) +
      (qualityFactor.score * qualityFactor.weight) +
      (budgetFactor.score * budgetFactor.weight) +
      (preferenceFactor.score * preferenceFactor.weight);
    
    return {
      modelId: option.model,
      provider: option.provider,
      qualityScore: option.qualityScore,
      cost: {
        amount: option.estimatedCost.totalCost,
        currency: option.estimatedCost.currency
      },
      factors: [costFactor, qualityFactor, budgetFactor, preferenceFactor],
      totalScore,
      selected: option.model === selectedModel
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Generate reasoning text
 */
function generateReasoning(
  selectedModel: string,
  originalModel: string | undefined,
  alternatives: any[],
  budgetStatus: any,
  budgetPriority: string,
  qualityRequirement: string,
  comparisons: ModelComparison[]
): string {
  const selectedComparison = comparisons.find(c => c.modelId === selectedModel);
  if (!selectedComparison) {
    return `${selectedModel} was selected based on the given constraints.`;
  }
  
  let reasoning = `${selectedModel} was selected`;
  
  // Add quality information
  if (selectedComparison.qualityScore >= 90) {
    reasoning += ' as it provides excellent quality';
  } else if (selectedComparison.qualityScore >= 75) {
    reasoning += ' as it provides good quality';
  } else if (selectedComparison.qualityScore >= 60) {
    reasoning += ' as it provides adequate quality';
  } else {
    reasoning += ' as it meets the minimum quality requirements';
  }
  
  // Add cost information
  reasoning += ` at a cost of ${selectedComparison.cost.amount.toFixed(4)} ${selectedComparison.cost.currency}`;
  
  // Add budget information if available
  if (budgetStatus) {
    if (budgetStatus.status === 'exceeded') {
      reasoning += '. Budget is exceeded, so cost was prioritized over quality';
    } else if (budgetStatus.status === 'critical') {
      reasoning += '. Budget is critical, so cost was given higher priority';
    } else if (budgetStatus.status === 'warning') {
      reasoning += '. Budget is approaching its limit, so cost was considered carefully';
    }
  }
  
  // Add budget priority information
  switch (budgetPriority) {
    case 'cost-saving':
      reasoning += '. Cost-saving priority was applied, favoring cheaper models';
      break;
    case 'quality-first':
      reasoning += '. Quality-first priority was applied, favoring higher quality models';
      break;
    case 'balanced':
      reasoning += '. Balanced priority was applied, considering both cost and quality';
      break;
  }
  
  // Add quality requirement information
  switch (qualityRequirement) {
    case 'maximum':
      reasoning += '. Maximum quality requirement was applied';
      break;
    case 'high':
      reasoning += '. High quality requirement was applied';
      break;
    case 'minimum':
      reasoning += '. Minimum quality requirement was applied';
      break;
    case 'standard':
      reasoning += '. Standard quality requirement was applied';
      break;
  }
  
  // Add model change information if applicable
  if (originalModel && originalModel !== selectedModel) {
    reasoning += `. The originally requested model (${originalModel}) was changed`;
    
    // Find the original model in comparisons
    const originalComparison = comparisons.find(c => c.modelId === originalModel);
    if (originalComparison) {
      if (originalComparison.cost.amount > selectedComparison.cost.amount) {
        reasoning += ' to a cheaper alternative';
      } else {
        reasoning += ' due to other constraints';
      }
    }
  }
  
  // Add alternative information
  if (alternatives && alternatives.length > 0) {
    const cheaperAlts = alternatives.filter(alt => alt.costDifference < 0);
    const betterAlts = alternatives.filter(alt => alt.qualityDifference > 0);
    
    if (betterAlts.length > 0) {
      const bestAlt = betterAlts[0];
      reasoning += `. ${bestAlt.modelId} would provide higher quality (+${bestAlt.qualityDifference.toFixed(1)} points) but at an additional cost of ${Math.abs(bestAlt.costDifference).toFixed(4)} ${selectedComparison.cost.currency}`;
    }
    
    if (cheaperAlts.length > 0) {
      const cheapestAlt = cheaperAlts[0];
      reasoning += `. ${cheapestAlt.modelId} would cost ${Math.abs(cheapestAlt.costDifference).toFixed(4)} ${selectedComparison.cost.currency} less but with lower quality (-${Math.abs(cheapestAlt.qualityDifference).toFixed(1)} points)`;
    }
  }
  
  return reasoning;
}

/**
 * Generate visualization data
 */
function generateVisualizationData(
  comparisons: ModelComparison[],
  factors: {
    costWeight: number;
    qualityWeight: number;
    budgetWeight: number;
    preferenceWeight: number;
  }
): any {
  // Create data for radar chart
  const radarData = {
    labels: ['Cost', 'Quality', 'Budget Impact', 'Preference'],
    datasets: comparisons.map(comparison => ({
      label: comparison.modelId,
      data: [
        comparison.factors[0].score * 100,
        comparison.factors[1].score * 100,
        comparison.factors[2].score * 100,
        comparison.factors[3].score * 100
      ],
      backgroundColor: comparison.selected ? 'rgba(54, 162, 235, 0.2)' : 'rgba(255, 99, 132, 0.2)',
      borderColor: comparison.selected ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
      borderWidth: comparison.selected ? 2 : 1
    }))
  };
  
  // Create data for bar chart
  const barData = {
    labels: comparisons.map(c => c.modelId),
    datasets: [
      {
        label: 'Total Score',
        data: comparisons.map(c => c.totalScore * 100),
        backgroundColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
        borderColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'),
        borderWidth: 1
      }
    ]
  };
  
  // Create data for cost comparison
  const costData = {
    labels: comparisons.map(c => c.modelId),
    datasets: [
      {
        label: 'Cost',
        data: comparisons.map(c => c.cost.amount),
        backgroundColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
        borderColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'),
        borderWidth: 1
      }
    ]
  };
  
  // Create data for quality comparison
  const qualityData = {
    labels: comparisons.map(c => c.modelId),
    datasets: [
      {
        label: 'Quality Score',
        data: comparisons.map(c => c.qualityScore),
        backgroundColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
        borderColor: comparisons.map(c => c.selected ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'),
        borderWidth: 1
      }
    ]
  };
  
  // Create data for factor weights
  const weightData = {
    labels: ['Cost', 'Quality', 'Budget Impact', 'Preference'],
    datasets: [
      {
        label: 'Factor Weights',
        data: [
          factors.costWeight * 100,
          factors.qualityWeight * 100,
          factors.budgetWeight * 100,
          factors.preferenceWeight * 100
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  return {
    radar: radarData,
    bar: barData,
    cost: costData,
    quality: qualityData,
    weights: weightData
  };
}

/**
 * Store explanation in database
 */
async function storeExplanation(explanation: SelectionExplanation): Promise<void> {
  try {
    await query(
      `INSERT INTO model_selection_explanations (
        id, request_id, timestamp, selected_model, original_model,
        budget_status, budget_priority, quality_requirement, factors,
        comparisons, reasoning, visualization_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        explanation.id,
        explanation.requestId,
        explanation.timestamp,
        explanation.selectedModel,
        explanation.originalModel || null,
        explanation.budgetStatus || null,
        explanation.budgetPriority || 'balanced',
        explanation.qualityRequirement || 'standard',
        JSON.stringify(explanation.factors),
        JSON.stringify(explanation.comparisons),
        explanation.reasoning,
        JSON.stringify(explanation.visualizationData)
      ]
    );
  } catch (error) {
    logger.error(`Error storing explanation for request ${explanation.requestId}:`, error);
    throw error;
  }
}

/**
 * Get explanation by ID
 */
export async function getExplanationById(id: string): Promise<SelectionExplanation | null> {
  try {
    const result = await query(
      `SELECT * FROM model_selection_explanations WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      requestId: row.request_id,
      timestamp: row.timestamp,
      selectedModel: row.selected_model,
      originalModel: row.original_model,
      budgetStatus: row.budget_status,
      budgetPriority: row.budget_priority,
      qualityRequirement: row.quality_requirement,
      factors: JSON.parse(row.factors),
      comparisons: JSON.parse(row.comparisons),
      reasoning: row.reasoning,
      visualizationData: JSON.parse(row.visualization_data)
    };
  } catch (error) {
    logger.error(`Error getting explanation by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get explanations by request ID
 */
export async function getExplanationsByRequestId(requestId: string): Promise<SelectionExplanation[]> {
  try {
    const result = await query(
      `SELECT * FROM model_selection_explanations WHERE request_id = $1 ORDER BY timestamp DESC`,
      [requestId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      requestId: row.request_id,
      timestamp: row.timestamp,
      selectedModel: row.selected_model,
      originalModel: row.original_model,
      budgetStatus: row.budget_status,
      budgetPriority: row.budget_priority,
      qualityRequirement: row.quality_requirement,
      factors: JSON.parse(row.factors),
      comparisons: JSON.parse(row.comparisons),
      reasoning: row.reasoning,
      visualizationData: JSON.parse(row.visualization_data)
    }));
  } catch (error) {
    logger.error(`Error getting explanations by request ID ${requestId}:`, error);
    throw error;
  }
}