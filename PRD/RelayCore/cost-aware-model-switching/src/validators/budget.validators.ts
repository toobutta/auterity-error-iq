/**
 * Budget Validators
 * 
 * Validation functions for budget-related API requests
 */

/**
 * Validates a budget creation request
 */
export function validateBudgetCreate(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // Check required fields
    if (!data.name) {
      return { success: false, error: 'Name is required' };
    }
    
    if (!data.scopeType) {
      return { success: false, error: 'Scope type is required' };
    }
    
    if (!data.scopeId) {
      return { success: false, error: 'Scope ID is required' };
    }
    
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      return { success: false, error: 'Amount must be a positive number' };
    }
    
    if (!data.currency) {
      return { success: false, error: 'Currency is required' };
    }
    
    if (!data.period) {
      return { success: false, error: 'Period is required' };
    }
    
    if (!data.startDate) {
      return { success: false, error: 'Start date is required' };
    }
    
    // Validate scope type
    const validScopeTypes = ['organization', 'team', 'user', 'project'];
    if (!validScopeTypes.includes(data.scopeType)) {
      return { 
        success: false, 
        error: `Invalid scope type. Must be one of: ${validScopeTypes.join(', ')}` 
      };
    }
    
    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'];
    if (!validPeriods.includes(data.period)) {
      return { 
        success: false, 
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
      };
    }
    
    // Validate dates
    try {
      new Date(data.startDate);
      
      if (data.endDate) {
        new Date(data.endDate);
        
        // Check that end date is after start date
        if (new Date(data.endDate) <= new Date(data.startDate)) {
          return { success: false, error: 'End date must be after start date' };
        }
      }
    } catch (error) {
      return { success: false, error: 'Invalid date format' };
    }
    
    // Validate thresholds
    if (data.warningThreshold !== undefined) {
      if (typeof data.warningThreshold !== 'number' || 
          data.warningThreshold < 0 || 
          data.warningThreshold > 100) {
        return { success: false, error: 'Warning threshold must be a number between 0 and 100' };
      }
    }
    
    if (data.criticalThreshold !== undefined) {
      if (typeof data.criticalThreshold !== 'number' || 
          data.criticalThreshold < 0 || 
          data.criticalThreshold > 100) {
        return { success: false, error: 'Critical threshold must be a number between 0 and 100' };
      }
      
      // Check that critical threshold is greater than warning threshold
      if (data.warningThreshold !== undefined && 
          data.criticalThreshold <= data.warningThreshold) {
        return { success: false, error: 'Critical threshold must be greater than warning threshold' };
      }
    }
    
    // Validate actions
    const validActions = ['notify', 'restrict-models', 'require-approval', 'block-all', 'auto-downgrade'];
    
    if (data.warningAction && !validActions.includes(data.warningAction)) {
      return { 
        success: false, 
        error: `Invalid warning action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    if (data.criticalAction && !validActions.includes(data.criticalAction)) {
      return { 
        success: false, 
        error: `Invalid critical action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    if (data.exhaustedAction && !validActions.includes(data.exhaustedAction)) {
      return { 
        success: false, 
        error: `Invalid exhausted action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid budget data' };
  }
}

/**
 * Validates a budget update request
 */
export function validateBudgetUpdate(data: any): { success: boolean; data?: any; error?: string } {
  try {
    // All fields are optional for updates, but if provided, they must be valid
    
    // Validate scope type if provided
    if (data.scopeType) {
      const validScopeTypes = ['organization', 'team', 'user', 'project'];
      if (!validScopeTypes.includes(data.scopeType)) {
        return { 
          success: false, 
          error: `Invalid scope type. Must be one of: ${validScopeTypes.join(', ')}` 
        };
      }
    }
    
    // Validate amount if provided
    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        return { success: false, error: 'Amount must be a positive number' };
      }
    }
    
    // Validate period if provided
    if (data.period) {
      const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'];
      if (!validPeriods.includes(data.period)) {
        return { 
          success: false, 
          error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
        };
      }
    }
    
    // Validate dates if provided
    if (data.startDate) {
      try {
        new Date(data.startDate);
      } catch (error) {
        return { success: false, error: 'Invalid start date format' };
      }
    }
    
    if (data.endDate) {
      try {
        new Date(data.endDate);
        
        // Check that end date is after start date if both are provided
        if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
          return { success: false, error: 'End date must be after start date' };
        }
      } catch (error) {
        return { success: false, error: 'Invalid end date format' };
      }
    }
    
    // Validate thresholds
    if (data.warningThreshold !== undefined) {
      if (typeof data.warningThreshold !== 'number' || 
          data.warningThreshold < 0 || 
          data.warningThreshold > 100) {
        return { success: false, error: 'Warning threshold must be a number between 0 and 100' };
      }
    }
    
    if (data.criticalThreshold !== undefined) {
      if (typeof data.criticalThreshold !== 'number' || 
          data.criticalThreshold < 0 || 
          data.criticalThreshold > 100) {
        return { success: false, error: 'Critical threshold must be a number between 0 and 100' };
      }
      
      // Check that critical threshold is greater than warning threshold if both are provided
      if (data.warningThreshold !== undefined && 
          data.criticalThreshold <= data.warningThreshold) {
        return { success: false, error: 'Critical threshold must be greater than warning threshold' };
      }
    }
    
    // Validate actions
    const validActions = ['notify', 'restrict-models', 'require-approval', 'block-all', 'auto-downgrade'];
    
    if (data.warningAction && !validActions.includes(data.warningAction)) {
      return { 
        success: false, 
        error: `Invalid warning action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    if (data.criticalAction && !validActions.includes(data.criticalAction)) {
      return { 
        success: false, 
        error: `Invalid critical action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    if (data.exhaustedAction && !validActions.includes(data.exhaustedAction)) {
      return { 
        success: false, 
        error: `Invalid exhausted action. Must be one of: ${validActions.join(', ')}` 
      };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Invalid budget data' };
  }
}