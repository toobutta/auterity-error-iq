/**
 * Model Selection API Routes
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database';
import { get, set } from '../cache';
import { createLogger } from '../utils/logger';
import { validateSelectionRequest, validateEstimateRequest } from '../validators/selection.validators';
import { estimateTokens } from '../utils/token-estimator';

const router = express.Router();
const logger = createLogger('selection-routes');

// Cache TTL in seconds (24 hours by default)
const TOKEN_CACHE_TTL = parseInt(process.env.TOKEN_CACHE_TTL || '86400');

/**
 * Select a model for a request
 * POST /api/v1/models/select
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateSelectionRequest(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const selectionRequest = validation.data;
    
    // Extract metadata
    const {
      userId,
      organizationId,
      teamId,
      projectId,
      taskType,
      qualityRequirement,
      budgetPriority
    } = selectionRequest.metadata || {};
    
    // Extract constraints
    const {
      preferredModel,
      excludedModels,
      maxCost,
      minQuality,
      requiredCapabilities
    } = selectionRequest.constraints || {};
    
    // Check budget status if scope is provided
    let budgetStatus = null;
    let budgetId = null;
    
    if (organizationId || teamId || userId) {
      // Determine scope priority: user > team > organization
      let scopeType: string;
      let scopeId: string;
      
      if (userId) {
        scopeType = 'user';
        scopeId = userId;
      } else if (teamId) {
        scopeType = 'team';
        scopeId = teamId;
      } else {
        scopeType = 'organization';
        scopeId = organizationId as string;
      }
      
      // Get budget for scope
      const budgetResult = await query(
        `SELECT b.id, b.limit_amount, b.current_spend, b.warning_threshold, b.critical_threshold
         FROM budget_configs b
         WHERE b.scope = $1 AND b.scope_id = $2 AND b.enabled = true
         ORDER BY b.created_at DESC
         LIMIT 1`,
        [scopeType, scopeId]
      );
      
      if (budgetResult.rows.length > 0) {
        const budget = budgetResult.rows[0];
        budgetId = budget.id;
        
        // Get current spend
        const spendResult = await query(
          `SELECT SUM(cost) as total_cost
           FROM cost_tracking
           WHERE budget_id = $1`,
          [budgetId]
        );
        
        const currentSpend = parseFloat(spendResult.rows[0]?.total_cost || '0');
        const limitAmount = parseFloat(budget.limit_amount);
        const percentUsed = (currentSpend / limitAmount) * 100;
        
        budgetStatus = {
          budgetId,
          currentSpend,
          limitAmount,
          percentUsed,
          remaining: limitAmount - currentSpend,
          status: percentUsed >= 100 ? 'exceeded' : 
                 percentUsed >= parseFloat(budget.critical_threshold) ? 'critical' :
                 percentUsed >= parseFloat(budget.warning_threshold) ? 'warning' : 'normal'
        };
      }
    }
    
    // Estimate tokens for the request
    const tokenEstimates = await estimateRequestTokens(selectionRequest);
    
    // Get available models
    let modelQuery = `
      SELECT m.*
      FROM model_cost_profiles m
      WHERE m.enabled = true
    `;
    
    const modelParams: any[] = [];
    let paramIndex = 1;
    
    // Add capability constraints if specified
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      const capabilityConditions = requiredCapabilities.map(cap => {
        return `m.capabilities->>'${cap}' = 'true'`;
      });
      
      modelQuery += ` AND (${capabilityConditions.join(' AND ')})`;
    }
    
    // Add excluded models constraint if specified
    if (excludedModels && excludedModels.length > 0) {
      modelQuery += ` AND m.model NOT IN (${excludedModels.map((_, i) => `$${paramIndex++}`).join(', ')})`;
      modelParams.push(...excludedModels);
    }
    
    // Execute query
    const modelResult = await query(modelQuery, modelParams);
    const availableModels = modelResult.rows.map(mapModelFromDb);
    
    if (availableModels.length === 0) {
      return res.status(404).json({ error: 'No suitable models found' });
    }
    
    // Calculate costs for each model
    const modelOptions = availableModels.map(model => {
      const inputCost = tokenEstimates.inputTokens * model.costPerToken.input;
      const outputCost = tokenEstimates.estimatedOutputTokens * model.costPerToken.output;
      const totalCost = inputCost + outputCost;
      
      // Calculate quality score based on task type
      const qualityScore = calculateQualityScore(model, taskType || 'general-chat');
      
      return {
        ...model,
        estimatedCost: {
          inputCost,
          outputCost,
          totalCost,
          currency: model.costPerToken.currency
        },
        qualityScore,
        budgetImpact: budgetStatus ? {
          percentOfRemaining: budgetStatus.remaining > 0 ? (totalCost / budgetStatus.remaining) * 100 : 100,
          status: totalCost > budgetStatus.remaining ? 'high' : 
                 totalCost > (budgetStatus.remaining * 0.1) ? 'medium' : 'low'
        } : null
      };
    });
    
    // Apply constraints
    let filteredOptions = modelOptions;
    
    // Apply max cost constraint if specified
    if (maxCost !== undefined && maxCost > 0) {
      filteredOptions = filteredOptions.filter(option => option.estimatedCost.totalCost <= maxCost);
    }
    
    // Apply min quality constraint if specified
    if (minQuality !== undefined && minQuality > 0) {
      filteredOptions = filteredOptions.filter(option => option.qualityScore >= minQuality);
    }
    
    // Apply budget constraints based on budget status
    if (budgetStatus) {
      if (budgetStatus.status === 'exceeded') {
        // Only allow very cheap models when budget is exceeded
        filteredOptions = filteredOptions.filter(option => 
          option.estimatedCost.totalCost < (budgetStatus.limitAmount * 0.001)
        );
      } else if (budgetStatus.status === 'critical') {
        // Prefer cheaper models when budget is critical
        filteredOptions = filteredOptions.filter(option => 
          option.estimatedCost.totalCost < (budgetStatus.remaining * 0.1)
        );
      } else if (budgetStatus.status === 'warning') {
        // Avoid expensive models when budget is warning
        filteredOptions = filteredOptions.filter(option => 
          option.estimatedCost.totalCost < (budgetStatus.remaining * 0.2)
        );
      }
    }
    
    // If no models pass the constraints, relax them and try again
    if (filteredOptions.length === 0) {
      logger.warn('No models passed constraints, relaxing constraints');
      filteredOptions = modelOptions;
    }
    
    // Select the best model based on the selection algorithm
    const selectedModel = selectBestModel(
      filteredOptions, 
      preferredModel, 
      budgetPriority || 'balanced',
      qualityRequirement || 'standard',
      budgetStatus?.status || 'normal'
    );
    
    // Get alternatives
    const alternatives = getAlternatives(selectedModel, filteredOptions);
    
    // Generate fallback chain
    const fallbackChain = generateFallbackChain(selectedModel, filteredOptions);
    
    // Create selection response
    const selectionResponse = {
      requestId: selectionRequest.requestId,
      selectedModel: selectedModel.model,
      alternatives,
      reasoning: generateSelectionReasoning(selectedModel, alternatives, budgetStatus),
      estimatedCost: {
        amount: selectedModel.estimatedCost.totalCost,
        currency: selectedModel.estimatedCost.currency,
        breakdown: {
          inputTokens: tokenEstimates.inputTokens,
          outputTokens: tokenEstimates.estimatedOutputTokens,
          inputCost: selectedModel.estimatedCost.inputCost,
          outputCost: selectedModel.estimatedCost.outputCost
        }
      },
      budgetImpact: selectedModel.budgetImpact || {
        budgetId: null,
        percentOfRemaining: 0,
        status: 'low'
      },
      qualityExpectation: selectedModel.qualityScore,
      fallbackChain
    };
    
    // Record selection in history
    await recordSelectionHistory(
      selectionRequest.requestId,
      userId,
      organizationId,
      teamId,
      selectedModel.model,
      preferredModel,
      alternatives,
      selectionResponse.reasoning,
      selectedModel.budgetImpact,
      selectedModel.estimatedCost,
      selectedModel.qualityScore
    );
    
    // Return selection response
    return res.status(200).json(selectionResponse);
  } catch (error) {
    logger.error('Error selecting model:', error);
    next(error);
  }
});

/**
 * Estimate cost for a request
 * POST /api/v1/models/estimate
 */
router.post('/estimate', async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateEstimateRequest(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const estimateRequest = validation.data;
    
    // Estimate tokens for the request
    const tokenEstimates = await estimateRequestTokens({
      content: estimateRequest.content
    });
    
    // Get models
    let modelQuery = 'SELECT * FROM model_cost_profiles WHERE enabled = true';
    const modelParams: any[] = [];
    
    // Filter by specified models if provided
    if (estimateRequest.models && estimateRequest.models.length > 0) {
      modelQuery += ` AND model IN (${estimateRequest.models.map((_, i) => `$${i + 1}`).join(', ')})`;
      modelParams.push(...estimateRequest.models);
    }
    
    // Execute query
    const modelResult = await query(modelQuery, modelParams);
    const models = modelResult.rows.map(mapModelFromDb);
    
    // Calculate costs for each model
    const estimates = models.map(model => {
      const inputCost = tokenEstimates.inputTokens * model.costPerToken.input;
      const outputCost = tokenEstimates.estimatedOutputTokens * model.costPerToken.output;
      const totalCost = inputCost + outputCost;
      
      return {
        modelId: model.model,
        provider: model.provider,
        inputTokens: tokenEstimates.inputTokens,
        estimatedOutputTokens: tokenEstimates.estimatedOutputTokens,
        cost: {
          amount: totalCost,
          currency: model.costPerToken.currency,
          breakdown: {
            inputCost,
            outputCost
          }
        }
      };
    });
    
    // Sort by cost (ascending)
    estimates.sort((a, b) => a.cost.amount - b.cost.amount);
    
    // Return estimates
    return res.status(200).json({ estimates });
  } catch (error) {
    logger.error('Error estimating cost:', error);
    next(error);
  }
});

/**
 * Get fallback chain for a model
 * GET /api/v1/models/fallbacks/:modelId
 */
router.get('/fallbacks/:modelId', async (req, res, next) => {
  try {
    const modelId = req.params.modelId;
    
    // Get model
    const modelResult = await query(
      'SELECT * FROM model_cost_profiles WHERE model = $1 AND enabled = true',
      [modelId]
    );
    
    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found or not enabled' });
    }
    
    const model = mapModelFromDb(modelResult.rows[0]);
    
    // Get all enabled models
    const allModelsResult = await query(
      'SELECT * FROM model_cost_profiles WHERE enabled = true'
    );
    
    const allModels = allModelsResult.rows.map(mapModelFromDb);
    
    // Generate fallback chain
    const fallbackChain = generateFallbackChain(model, allModels);
    
    // Return fallback chain
    return res.status(200).json({
      model: modelId,
      fallbackChain
    });
  } catch (error) {
    logger.error('Error getting fallback chain:', error);
    next(error);
  }
});

/**
 * Helper function to estimate tokens for a request
 */
async function estimateRequestTokens(request: any): Promise<{ inputTokens: number, estimatedOutputTokens: number }> {
  try {
    // Generate a cache key based on the content
    const content = request.content || {};
    const contentString = JSON.stringify({
      messages: content.messages,
      prompt: content.prompt,
      systemPrompt: content.systemPrompt
    });
    
    const contentHash = Buffer.from(contentString).toString('base64');
    const cacheKey = `token_estimate:${contentHash}`;
    
    // Check cache first
    const cachedEstimate = await get<{ inputTokens: number, estimatedOutputTokens: number }>(cacheKey);
    if (cachedEstimate) {
      return cachedEstimate;
    }
    
    // Estimate tokens using the token estimator utility
    const estimate = await estimateTokens(content);
    
    // Cache the result
    await set(cacheKey, estimate, TOKEN_CACHE_TTL);
    
    // Also store in database for analytics
    await query(
      `INSERT INTO token_estimation_cache (
        id, content_hash, input_tokens, estimated_output_tokens, 
        model, task_type, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (content_hash, model) DO UPDATE SET
        input_tokens = $3,
        estimated_output_tokens = $4,
        created_at = $7,
        expires_at = $8`,
      [
        uuidv4(),
        contentHash,
        estimate.inputTokens,
        estimate.estimatedOutputTokens,
        request.constraints?.preferredModel || null,
        request.metadata?.taskType || null,
        new Date().toISOString(),
        new Date(Date.now() + TOKEN_CACHE_TTL * 1000).toISOString()
      ]
    );
    
    return estimate;
  } catch (error) {
    logger.error('Error estimating tokens:', error);
    
    // Return default estimates if estimation fails
    return {
      inputTokens: calculateDefaultInputTokens(request),
      estimatedOutputTokens: calculateDefaultOutputTokens(request)
    };
  }
}

/**
 * Helper function to calculate default input tokens
 */
function calculateDefaultInputTokens(request: any): number {
  const content = request.content || {};
  
  if (content.messages && Array.isArray(content.messages)) {
    // Estimate based on message length
    return content.messages.reduce((total, message) => {
      return total + (message.content ? message.content.length / 4 : 0);
    }, 0);
  } else if (content.prompt) {
    // Estimate based on prompt length
    return content.prompt.length / 4;
  } else {
    // Default value
    return 100;
  }
}

/**
 * Helper function to calculate default output tokens
 */
function calculateDefaultOutputTokens(request: any): number {
  // Default to 3x input tokens as a rough estimate
  return calculateDefaultInputTokens(request) * 3;
}

/**
 * Helper function to calculate quality score based on task type
 */
function calculateQualityScore(model: any, taskType: string): number {
  const capabilities = model.capabilities || {};
  const qualityScores = model.qualityScores || {};
  
  switch (taskType) {
    case 'code-generation':
      return qualityScores.coding || (capabilities.codeGeneration ? 80 : 50);
    case 'creative-writing':
      return qualityScores.creativity || (capabilities.textGeneration ? 75 : 50);
    case 'data-analysis':
      return qualityScores.reasoning || (capabilities.reasoning ? 70 : 50);
    case 'reasoning':
      return qualityScores.reasoning || (capabilities.reasoning ? 85 : 50);
    case 'summarization':
      return qualityScores.knowledge || (capabilities.textGeneration ? 75 : 50);
    case 'translation':
      return qualityScores.knowledge || (capabilities.textGeneration ? 80 : 50);
    case 'question-answering':
      return qualityScores.knowledge || (capabilities.textGeneration ? 80 : 50);
    case 'general-chat':
    default:
      // Average of all scores
      const scores = Object.values(qualityScores).filter(score => typeof score === 'number');
      if (scores.length > 0) {
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
      } else {
        return capabilities.textGeneration ? 70 : 50;
      }
  }
}

/**
 * Helper function to select the best model based on constraints and preferences
 */
function selectBestModel(
  options: any[],
  preferredModel: string | undefined,
  budgetPriority: string,
  qualityRequirement: string,
  budgetStatus: string
): any {
  // If preferred model is specified and available, use it if budget allows
  if (preferredModel) {
    const preferred = options.find(option => option.model === preferredModel);
    
    if (preferred) {
      // Check if budget status allows using preferred model
      if (budgetStatus === 'normal' || 
          (budgetStatus === 'warning' && budgetPriority !== 'cost-saving') ||
          (budgetStatus === 'critical' && budgetPriority === 'quality-first' && preferred.budgetImpact?.status !== 'high')) {
        return preferred;
      }
    }
  }
  
  // Calculate weights based on budget priority and quality requirement
  let qualityWeight: number;
  let costWeight: number;
  
  switch (budgetPriority) {
    case 'cost-saving':
      qualityWeight = 0.3;
      costWeight = 0.7;
      break;
    case 'quality-first':
      qualityWeight = 0.7;
      costWeight = 0.3;
      break;
    case 'balanced':
    default:
      qualityWeight = 0.5;
      costWeight = 0.5;
  }
  
  // Adjust weights based on budget status
  if (budgetStatus === 'warning') {
    costWeight += 0.1;
    qualityWeight -= 0.1;
  } else if (budgetStatus === 'critical') {
    costWeight += 0.2;
    qualityWeight -= 0.2;
  } else if (budgetStatus === 'exceeded') {
    costWeight += 0.3;
    qualityWeight -= 0.3;
  }
  
  // Normalize weights
  const totalWeight = qualityWeight + costWeight;
  qualityWeight /= totalWeight;
  costWeight /= totalWeight;
  
  // Calculate minimum quality score based on quality requirement
  let minQualityScore: number;
  switch (qualityRequirement) {
    case 'maximum':
      minQualityScore = 90;
      break;
    case 'high':
      minQualityScore = 75;
      break;
    case 'standard':
    default:
      minQualityScore = 50;
  }
  
  // Adjust minimum quality score based on budget status
  if (budgetStatus === 'warning') {
    minQualityScore -= 5;
  } else if (budgetStatus === 'critical') {
    minQualityScore -= 10;
  } else if (budgetStatus === 'exceeded') {
    minQualityScore -= 15;
  }
  
  // Filter options by minimum quality score
  let qualifiedOptions = options.filter(option => option.qualityScore >= minQualityScore);
  
  // If no options meet the quality threshold, relax the constraint
  if (qualifiedOptions.length === 0) {
    qualifiedOptions = options;
  }
  
  // Find the maximum cost for normalization
  const maxCost = Math.max(...qualifiedOptions.map(option => option.estimatedCost.totalCost));
  
  // Calculate scores for each option
  const scoredOptions = qualifiedOptions.map(option => {
    // Normalize cost (lower is better)
    const normalizedCost = maxCost > 0 ? 1 - (option.estimatedCost.totalCost / maxCost) : 1;
    
    // Normalize quality (higher is better)
    const normalizedQuality = option.qualityScore / 100;
    
    // Calculate weighted score
    const score = (normalizedQuality * qualityWeight) + (normalizedCost * costWeight);
    
    return {
      ...option,
      score
    };
  });
  
  // Sort by score (descending)
  scoredOptions.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring option
  return scoredOptions[0];
}

/**
 * Helper function to get alternatives to the selected model
 */
function getAlternatives(selectedModel: any, options: any[]): any[] {
  // Filter out the selected model
  const otherOptions = options.filter(option => option.model !== selectedModel.model);
  
  // Sort by quality score (descending)
  otherOptions.sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Take up to 3 alternatives
  const alternatives = otherOptions.slice(0, 3);
  
  // Format alternatives
  return alternatives.map(alt => ({
    modelId: alt.model,
    reason: alt.estimatedCost.totalCost > selectedModel.estimatedCost.totalCost ? 
      'Higher cost' : 
      'Lower quality',
    costDifference: alt.estimatedCost.totalCost - selectedModel.estimatedCost.totalCost,
    qualityDifference: alt.qualityScore - selectedModel.qualityScore
  }));
}

/**
 * Helper function to generate fallback chain
 */
function generateFallbackChain(selectedModel: any, options: any[]): string[] {
  // Filter out the selected model
  const otherOptions = options.filter(option => option.model !== selectedModel.model);
  
  // Sort by quality score (descending)
  otherOptions.sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Take up to 5 fallbacks
  const fallbacks = otherOptions.slice(0, 5);
  
  // Return model IDs
  return fallbacks.map(fallback => fallback.model);
}

/**
 * Helper function to generate selection reasoning
 */
function generateSelectionReasoning(selectedModel: any, alternatives: any[], budgetStatus: any): string {
  let reasoning = `${selectedModel.model} was selected`;
  
  // Add quality information
  if (selectedModel.qualityScore >= 90) {
    reasoning += ' as it provides excellent quality';
  } else if (selectedModel.qualityScore >= 75) {
    reasoning += ' as it provides good quality';
  } else if (selectedModel.qualityScore >= 60) {
    reasoning += ' as it provides adequate quality';
  } else {
    reasoning += ' as it meets the minimum quality requirements';
  }
  
  // Add cost information
  reasoning += ` at a cost of ${selectedModel.estimatedCost.totalCost.toFixed(4)} ${selectedModel.estimatedCost.currency}`;
  
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
  
  // Add alternative information
  if (alternatives.length > 0) {
    const cheaperAlts = alternatives.filter(alt => alt.costDifference < 0);
    const betterAlts = alternatives.filter(alt => alt.qualityDifference > 0);
    
    if (betterAlts.length > 0) {
      const bestAlt = betterAlts[0];
      reasoning += `. ${bestAlt.modelId} would provide higher quality (+${bestAlt.qualityDifference.toFixed(1)} points) but at an additional cost of ${Math.abs(bestAlt.costDifference).toFixed(4)} ${selectedModel.estimatedCost.currency}`;
    }
    
    if (cheaperAlts.length > 0) {
      const cheapestAlt = cheaperAlts[0];
      reasoning += `. ${cheapestAlt.modelId} would cost ${Math.abs(cheapestAlt.costDifference).toFixed(4)} ${selectedModel.estimatedCost.currency} less but with lower quality (-${Math.abs(cheapestAlt.qualityDifference).toFixed(1)} points)`;
    }
  }
  
  return reasoning;
}

/**
 * Helper function to record selection history
 */
async function recordSelectionHistory(
  requestId: string,
  userId: string | undefined,
  organizationId: string | undefined,
  teamId: string | undefined,
  selectedModel: string,
  originalModel: string | undefined,
  alternatives: any[],
  selectionReason: string,
  budgetImpact: any,
  estimatedCost: any,
  qualityExpectation: number
): Promise<void> {
  try {
    await query(
      `INSERT INTO model_selection_history (
        id, request_id, timestamp, user_id, organization_id, team_id,
        selected_model, original_model, alternatives, selection_reason,
        budget_impact, estimated_cost, quality_expectation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        uuidv4(),
        requestId,
        new Date().toISOString(),
        userId,
        organizationId,
        teamId,
        selectedModel,
        originalModel,
        JSON.stringify(alternatives),
        selectionReason,
        JSON.stringify(budgetImpact),
        JSON.stringify(estimatedCost),
        qualityExpectation
      ]
    );
  } catch (error) {
    logger.error('Error recording selection history:', error);
    // Don't throw error, just log it
  }
}

/**
 * Helper function to map database model to API response format
 */
function mapModelFromDb(dbModel: any): any {
  return {
    id: dbModel.id,
    provider: dbModel.provider,
    model: dbModel.model,
    costPerToken: {
      input: parseFloat(dbModel.input_token_cost),
      output: parseFloat(dbModel.output_token_cost),
      currency: dbModel.currency
    },
    averageLatency: dbModel.average_latency,
    throughput: dbModel.throughput,
    capabilities: JSON.parse(dbModel.capabilities),
    alternatives: JSON.parse(dbModel.alternatives),
    qualityScores: {
      reasoning: 85, // Default values since we don't have these in the database yet
      creativity: 80,
      knowledge: 85,
      coding: 80,
      math: 75
    },
    updatedAt: dbModel.updated_at,
    enabled: dbModel.enabled
  };
}

export default router;