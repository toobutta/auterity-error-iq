/**
 * Selection Validators
 * 
 * Validation functions for model selection API requests
 */

/**
 * Validates a model selection request
 */
export function validateSelectionRequest(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // Check required fields
    if (!data.requestId) {
      return { success: false, error: 'Request ID is required' };
    }
    
    if (!data.content) {
      return { success: false, error: 'Content is required' };
    }
    
    // Validate content
    const content = data.content;
    
    // Must have either messages or prompt
    if (!content.messages && !content.prompt) {
      return { success: false, error: 'Either messages or prompt is required' };
    }
    
    // Validate messages if provided
    if (content.messages) {
      if (!Array.isArray(content.messages)) {
        return { success: false, error: 'Messages must be an array' };
      }
      
      // Check that all messages have required fields
      for (const message of content.messages) {
        if (!message.role) {
          return { success: false, error: 'Message role is required' };
        }
        
        if (!message.content && message.role !== 'function') {
          return { success: false, error: 'Message content is required' };
        }
        
        // Validate role
        const validRoles = ['system', 'user', 'assistant', 'function'];
        if (!validRoles.includes(message.role)) {
          return { 
            success: false, 
            error: `Invalid message role. Must be one of: ${validRoles.join(', ')}` 
          };
        }
        
        // Validate function call if present
        if (message.function_call) {
          if (typeof message.function_call !== 'object') {
            return { success: false, error: 'Function call must be an object' };
          }
          
          if (!message.function_call.name) {
            return { success: false, error: 'Function call name is required' };
          }
        }
      }
    }
    
    // Validate metadata if provided
    if (data.metadata) {
      // Validate task type if provided
      if (data.metadata.taskType) {
        const validTaskTypes = [
          'general-chat',
          'creative-writing',
          'code-generation',
          'data-analysis',
          'reasoning',
          'summarization',
          'translation',
          'question-answering'
        ];
        
        if (!validTaskTypes.includes(data.metadata.taskType)) {
          return { 
            success: false, 
            error: `Invalid task type. Must be one of: ${validTaskTypes.join(', ')}` 
          };
        }
      }
      
      // Validate quality requirement if provided
      if (data.metadata.qualityRequirement) {
        const validQualityRequirements = ['standard', 'high', 'maximum'];
        
        if (!validQualityRequirements.includes(data.metadata.qualityRequirement)) {
          return { 
            success: false, 
            error: `Invalid quality requirement. Must be one of: ${validQualityRequirements.join(', ')}` 
          };
        }
      }
      
      // Validate budget priority if provided
      if (data.metadata.budgetPriority) {
        const validBudgetPriorities = ['cost-saving', 'balanced', 'quality-first'];
        
        if (!validBudgetPriorities.includes(data.metadata.budgetPriority)) {
          return { 
            success: false, 
            error: `Invalid budget priority. Must be one of: ${validBudgetPriorities.join(', ')}` 
          };
        }
      }
      
      // Validate tags if provided
      if (data.metadata.tags && typeof data.metadata.tags !== 'object') {
        return { success: false, error: 'Tags must be an object' };
      }
    }
    
    // Validate constraints if provided
    if (data.constraints) {
      // Validate max cost if provided
      if (data.constraints.maxCost !== undefined && 
          (typeof data.constraints.maxCost !== 'number' || data.constraints.maxCost < 0)) {
        return { success: false, error: 'Max cost must be a non-negative number' };
      }
      
      // Validate min quality if provided
      if (data.constraints.minQuality !== undefined && 
          (typeof data.constraints.minQuality !== 'number' || 
           data.constraints.minQuality < 0 || 
           data.constraints.minQuality > 100)) {
        return { success: false, error: 'Min quality must be a number between 0 and 100' };
      }
      
      // Validate excluded models if provided
      if (data.constraints.excludedModels) {
        if (!Array.isArray(data.constraints.excludedModels)) {
          return { success: false, error: 'Excluded models must be an array' };
        }
        
        // Check that all excluded models are strings
        for (const model of data.constraints.excludedModels) {
          if (typeof model !== 'string') {
            return { success: false, error: 'Excluded models must be strings' };
          }
        }
      }
      
      // Validate required capabilities if provided
      if (data.constraints.requiredCapabilities) {
        if (!Array.isArray(data.constraints.requiredCapabilities)) {
          return { success: false, error: 'Required capabilities must be an array' };
        }
        
        // Check that all required capabilities are strings
        for (const capability of data.constraints.requiredCapabilities) {
          if (typeof capability !== 'string') {
            return { success: false, error: 'Required capabilities must be strings' };
          }
        }
      }
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid selection request data' };
  }
}

/**
 * Validates a cost estimate request
 */
export function validateEstimateRequest(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // Check required fields
    if (!data.content) {
      return { success: false, error: 'Content is required' };
    }
    
    // Validate content
    const content = data.content;
    
    // Must have either messages or prompt
    if (!content.messages && !content.prompt) {
      return { success: false, error: 'Either messages or prompt is required' };
    }
    
    // Validate messages if provided
    if (content.messages) {
      if (!Array.isArray(content.messages)) {
        return { success: false, error: 'Messages must be an array' };
      }
      
      // Check that all messages have required fields
      for (const message of content.messages) {
        if (!message.role) {
          return { success: false, error: 'Message role is required' };
        }
        
        if (!message.content && message.role !== 'function') {
          return { success: false, error: 'Message content is required' };
        }
        
        // Validate role
        const validRoles = ['system', 'user', 'assistant', 'function'];
        if (!validRoles.includes(message.role)) {
          return { 
            success: false, 
            error: `Invalid message role. Must be one of: ${validRoles.join(', ')}` 
          };
        }
      }
    }
    
    // Validate models if provided
    if (data.models) {
      if (!Array.isArray(data.models)) {
        return { success: false, error: 'Models must be an array' };
      }
      
      // Check that all models are strings
      for (const model of data.models) {
        if (typeof model !== 'string') {
          return { success: false, error: 'Models must be strings' };
        }
      }
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid estimate request data' };
  }
}