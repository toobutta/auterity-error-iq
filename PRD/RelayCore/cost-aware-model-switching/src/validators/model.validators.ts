/**
 * Model Validators
 * 
 * Validation functions for model-related API requests
 */

/**
 * Validates a model creation request
 */
export function validateModelCreate(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // Check required fields
    if (!data.provider) {
      return { success: false, error: 'Provider is required' };
    }
    
    if (!data.model) {
      return { success: false, error: 'Model name is required' };
    }
    
    if (!data.costPerToken) {
      return { success: false, error: 'Cost per token is required' };
    }
    
    if (data.costPerToken.input === undefined || data.costPerToken.input === null) {
      return { success: false, error: 'Input token cost is required' };
    }
    
    if (data.costPerToken.output === undefined || data.costPerToken.output === null) {
      return { success: false, error: 'Output token cost is required' };
    }
    
    if (!data.costPerToken.currency) {
      return { success: false, error: 'Currency is required' };
    }
    
    // Validate numeric fields
    if (typeof data.costPerToken.input !== 'number' || data.costPerToken.input < 0) {
      return { success: false, error: 'Input token cost must be a non-negative number' };
    }
    
    if (typeof data.costPerToken.output !== 'number' || data.costPerToken.output < 0) {
      return { success: false, error: 'Output token cost must be a non-negative number' };
    }
    
    if (data.averageLatency !== undefined && 
        (typeof data.averageLatency !== 'number' || data.averageLatency < 0)) {
      return { success: false, error: 'Average latency must be a non-negative number' };
    }
    
    if (data.throughput !== undefined && 
        (typeof data.throughput !== 'number' || data.throughput < 0)) {
      return { success: false, error: 'Throughput must be a non-negative number' };
    }
    
    // Validate capabilities if provided
    if (data.capabilities) {
      if (typeof data.capabilities !== 'object') {
        return { success: false, error: 'Capabilities must be an object' };
      }
      
      // Check that all capability values are booleans
      for (const [key, value] of Object.entries(data.capabilities)) {
        if (typeof value !== 'boolean') {
          return { success: false, error: `Capability '${key}' must be a boolean` };
        }
      }
    }
    
    // Validate alternatives if provided
    if (data.alternatives) {
      if (!Array.isArray(data.alternatives)) {
        return { success: false, error: 'Alternatives must be an array' };
      }
      
      // Check that all alternatives have required fields
      for (const alt of data.alternatives) {
        if (!alt.provider) {
          return { success: false, error: 'Alternative provider is required' };
        }
        
        if (!alt.model) {
          return { success: false, error: 'Alternative model is required' };
        }
        
        if (alt.costRatio === undefined || alt.costRatio === null) {
          return { success: false, error: 'Alternative cost ratio is required' };
        }
        
        if (typeof alt.costRatio !== 'number' || alt.costRatio < 0) {
          return { success: false, error: 'Alternative cost ratio must be a non-negative number' };
        }
        
        if (alt.qualityRatio === undefined || alt.qualityRatio === null) {
          return { success: false, error: 'Alternative quality ratio is required' };
        }
        
        if (typeof alt.qualityRatio !== 'number' || alt.qualityRatio < 0) {
          return { success: false, error: 'Alternative quality ratio must be a non-negative number' };
        }
      }
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid model data' };
  }
}

/**
 * Validates a model update request
 */
export function validateModelUpdate(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // All fields are optional for updates, but if provided, they must be valid
    
    // Validate cost per token if provided
    if (data.costPerToken) {
      if (data.costPerToken.input !== undefined && 
          (typeof data.costPerToken.input !== 'number' || data.costPerToken.input < 0)) {
        return { success: false, error: 'Input token cost must be a non-negative number' };
      }
      
      if (data.costPerToken.output !== undefined && 
          (typeof data.costPerToken.output !== 'number' || data.costPerToken.output < 0)) {
        return { success: false, error: 'Output token cost must be a non-negative number' };
      }
    }
    
    // Validate numeric fields if provided
    if (data.averageLatency !== undefined && 
        (typeof data.averageLatency !== 'number' || data.averageLatency < 0)) {
      return { success: false, error: 'Average latency must be a non-negative number' };
    }
    
    if (data.throughput !== undefined && 
        (typeof data.throughput !== 'number' || data.throughput < 0)) {
      return { success: false, error: 'Throughput must be a non-negative number' };
    }
    
    // Validate capabilities if provided
    if (data.capabilities) {
      if (typeof data.capabilities !== 'object') {
        return { success: false, error: 'Capabilities must be an object' };
      }
      
      // Check that all capability values are booleans
      for (const [key, value] of Object.entries(data.capabilities)) {
        if (typeof value !== 'boolean') {
          return { success: false, error: `Capability '${key}' must be a boolean` };
        }
      }
    }
    
    // Validate alternatives if provided
    if (data.alternatives) {
      if (!Array.isArray(data.alternatives)) {
        return { success: false, error: 'Alternatives must be an array' };
      }
      
      // Check that all alternatives have required fields
      for (const alt of data.alternatives) {
        if (alt.costRatio !== undefined && 
            (typeof alt.costRatio !== 'number' || alt.costRatio < 0)) {
          return { success: false, error: 'Alternative cost ratio must be a non-negative number' };
        }
        
        if (alt.qualityRatio !== undefined && 
            (typeof alt.qualityRatio !== 'number' || alt.qualityRatio < 0)) {
          return { success: false, error: 'Alternative quality ratio must be a non-negative number' };
        }
      }
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid model data' };
  }
}