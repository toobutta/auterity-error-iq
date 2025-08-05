/**
 * Cost Data Synchronization Module
 * 
 * This module handles synchronization of cost data between the Cost-Aware Model Switching
 * component and RelayCore/Auterity systems.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database';
import { createLogger } from '../utils/logger';

const logger = createLogger('cost-sync');

// Configuration from environment variables
const RELAYCORE_API_URL = process.env.RELAYCORE_API_URL || 'http://relaycore:3000';
const AUTERITY_API_URL = process.env.AUTERITY_API_URL || 'http://auterity:3001';
const SYNC_INTERVAL = parseInt(process.env.COST_SYNC_INTERVAL || '3600000'); // Default: 1 hour

/**
 * Initialize cost data synchronization
 */
export function initCostSync(): void {
  logger.info('Initializing cost data synchronization');
  
  // Start periodic sync
  setInterval(syncCostData, SYNC_INTERVAL);
  
  // Run initial sync
  syncCostData().catch(err => {
    logger.error('Error during initial cost data sync:', err);
  });
}

/**
 * Synchronize cost data with RelayCore and Auterity
 */
export async function syncCostData(): Promise<void> {
  try {
    logger.info('Starting cost data synchronization');
    
    // Get last sync timestamp
    const lastSyncResult = await query(
      `SELECT MAX(timestamp) as last_sync FROM cost_sync_history WHERE status = 'success'`
    );
    
    const lastSync = lastSyncResult.rows[0]?.last_sync || new Date(0).toISOString();
    const currentTime = new Date().toISOString();
    
    // Sync data from RelayCore
    await syncFromRelayCore(lastSync, currentTime);
    
    // Sync data from Auterity
    await syncFromAuterity(lastSync, currentTime);
    
    // Push cost data to RelayCore and Auterity
    await pushCostDataToRelayCore(lastSync, currentTime);
    await pushCostDataToAuterity(lastSync, currentTime);
    
    // Record successful sync
    await recordSyncHistory('success', 'Sync completed successfully', lastSync, currentTime);
    
    logger.info('Cost data synchronization completed successfully');
  } catch (error) {
    logger.error('Error synchronizing cost data:', error);
    
    // Record failed sync
    await recordSyncHistory('error', `Sync failed: ${error.message}`, '', new Date().toISOString())
      .catch(err => {
        logger.error('Error recording sync history:', err);
      });
  }
}

/**
 * Synchronize cost data from RelayCore
 */
async function syncFromRelayCore(lastSync: string, currentTime: string): Promise<void> {
  try {
    logger.info(`Fetching cost data from RelayCore since ${lastSync}`);
    
    // Fetch cost data from RelayCore
    const response = await axios.get(`${RELAYCORE_API_URL}/api/v1/cost-data`, {
      params: {
        since: lastSync,
        until: currentTime
      }
    });
    
    const costData = response.data;
    
    if (!costData || !Array.isArray(costData.records) || costData.records.length === 0) {
      logger.info('No new cost data from RelayCore');
      return;
    }
    
    logger.info(`Received ${costData.records.length} cost records from RelayCore`);
    
    // Process and store cost data
    await processCostRecords(costData.records, 'relaycore');
    
    logger.info('RelayCore cost data synchronization completed');
  } catch (error) {
    logger.error('Error synchronizing from RelayCore:', error);
    throw error;
  }
}

/**
 * Synchronize cost data from Auterity
 */
async function syncFromAuterity(lastSync: string, currentTime: string): Promise<void> {
  try {
    logger.info(`Fetching cost data from Auterity since ${lastSync}`);
    
    // Fetch cost data from Auterity
    const response = await axios.get(`${AUTERITY_API_URL}/api/v1/cost-data`, {
      params: {
        since: lastSync,
        until: currentTime
      }
    });
    
    const costData = response.data;
    
    if (!costData || !Array.isArray(costData.records) || costData.records.length === 0) {
      logger.info('No new cost data from Auterity');
      return;
    }
    
    logger.info(`Received ${costData.records.length} cost records from Auterity`);
    
    // Process and store cost data
    await processCostRecords(costData.records, 'auterity');
    
    logger.info('Auterity cost data synchronization completed');
  } catch (error) {
    logger.error('Error synchronizing from Auterity:', error);
    throw error;
  }
}

/**
 * Push cost data to RelayCore
 */
async function pushCostDataToRelayCore(lastSync: string, currentTime: string): Promise<void> {
  try {
    logger.info(`Pushing cost data to RelayCore since ${lastSync}`);
    
    // Get cost data to push
    const costData = await getNewCostData(lastSync, currentTime);
    
    if (costData.length === 0) {
      logger.info('No new cost data to push to RelayCore');
      return;
    }
    
    logger.info(`Pushing ${costData.length} cost records to RelayCore`);
    
    // Push data to RelayCore
    await axios.post(`${RELAYCORE_API_URL}/api/v1/cost-data/batch`, {
      records: costData
    });
    
    logger.info('Cost data pushed to RelayCore successfully');
  } catch (error) {
    logger.error('Error pushing cost data to RelayCore:', error);
    throw error;
  }
}

/**
 * Push cost data to Auterity
 */
async function pushCostDataToAuterity(lastSync: string, currentTime: string): Promise<void> {
  try {
    logger.info(`Pushing cost data to Auterity since ${lastSync}`);
    
    // Get cost data to push
    const costData = await getNewCostData(lastSync, currentTime);
    
    if (costData.length === 0) {
      logger.info('No new cost data to push to Auterity');
      return;
    }
    
    logger.info(`Pushing ${costData.length} cost records to Auterity`);
    
    // Push data to Auterity
    await axios.post(`${AUTERITY_API_URL}/api/v1/cost-data/batch`, {
      records: costData
    });
    
    logger.info('Cost data pushed to Auterity successfully');
  } catch (error) {
    logger.error('Error pushing cost data to Auterity:', error);
    throw error;
  }
}

/**
 * Get new cost data since last sync
 */
async function getNewCostData(lastSync: string, currentTime: string): Promise<any[]> {
  try {
    // Get cost data from database
    const result = await query(
      `SELECT 
        ct.id, ct.request_id, ct.user_id, ct.organization_id, ct.team_id,
        ct.provider, ct.model, ct.input_tokens, ct.output_tokens, ct.cost,
        ct.currency, ct.timestamp, ct.original_model, ct.downgraded, ct.budget_status
      FROM cost_tracking ct
      WHERE ct.timestamp > $1 AND ct.timestamp <= $2
      ORDER BY ct.timestamp ASC`,
      [lastSync, currentTime]
    );
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting new cost data:', error);
    throw error;
  }
}

/**
 * Process and store cost records
 */
async function processCostRecords(records: any[], source: string): Promise<void> {
  try {
    // Process records in batches to avoid overloading the database
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      await transaction(async (client) => {
        for (const record of batch) {
          // Check if record already exists
          const existingResult = await client.query(
            `SELECT id FROM cost_tracking WHERE request_id = $1 AND provider = $2 AND model = $3`,
            [record.request_id, record.provider, record.model]
          );
          
          if (existingResult.rows.length > 0) {
            // Update existing record
            await client.query(
              `UPDATE cost_tracking SET
                input_tokens = $1,
                output_tokens = $2,
                cost = $3,
                timestamp = $4,
                budget_status = $5,
                downgraded = $6
              WHERE id = $7`,
              [
                record.input_tokens,
                record.output_tokens,
                record.cost,
                record.timestamp,
                record.budget_status || 'normal',
                record.downgraded || false,
                existingResult.rows[0].id
              ]
            );
          } else {
            // Insert new record
            await client.query(
              `INSERT INTO cost_tracking (
                id, request_id, user_id, organization_id, team_id,
                provider, model, input_tokens, output_tokens, cost,
                currency, timestamp, original_model, downgraded, budget_status,
                source
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
              [
                uuidv4(),
                record.request_id,
                record.user_id,
                record.organization_id,
                record.team_id,
                record.provider,
                record.model,
                record.input_tokens,
                record.output_tokens,
                record.cost,
                record.currency || 'USD',
                record.timestamp,
                record.original_model,
                record.downgraded || false,
                record.budget_status || 'normal',
                source
              ]
            );
          }
          
          // Update budget spend if budget_id is provided
          if (record.budget_id) {
            await updateBudgetSpend(client, record.budget_id);
          } else if (record.user_id || record.team_id || record.organization_id) {
            // Try to find matching budget
            await updateMatchingBudgetSpend(client, record);
          }
        }
      });
    }
  } catch (error) {
    logger.error('Error processing cost records:', error);
    throw error;
  }
}

/**
 * Update budget spend for a specific budget
 */
async function updateBudgetSpend(client: any, budgetId: string): Promise<void> {
  try {
    // Calculate total spend for the budget
    const spendResult = await client.query(
      `SELECT SUM(cost) as total_cost
       FROM cost_tracking
       WHERE budget_id = $1`,
      [budgetId]
    );
    
    const currentSpend = parseFloat(spendResult.rows[0]?.total_cost || '0');
    
    // Update budget current spend
    await client.query(
      `UPDATE budget_configs
       SET current_spend = $1, last_updated = $2
       WHERE id = $3`,
      [currentSpend, new Date().toISOString(), budgetId]
    );
  } catch (error) {
    logger.error(`Error updating budget spend for budget ${budgetId}:`, error);
    throw error;
  }
}

/**
 * Update matching budget spend based on record metadata
 */
async function updateMatchingBudgetSpend(client: any, record: any): Promise<void> {
  try {
    // Find matching budget based on scope
    let budgetQuery = `SELECT id FROM budget_configs WHERE `;
    let params = [];
    
    if (record.user_id) {
      budgetQuery += `scope = 'user' AND scope_id = $1`;
      params.push(record.user_id);
    } else if (record.team_id) {
      budgetQuery += `scope = 'team' AND scope_id = $1`;
      params.push(record.team_id);
    } else if (record.organization_id) {
      budgetQuery += `scope = 'organization' AND scope_id = $1`;
      params.push(record.organization_id);
    } else {
      return; // No scope to match
    }
    
    budgetQuery += ` AND enabled = true ORDER BY created_at DESC LIMIT 1`;
    
    const budgetResult = await client.query(budgetQuery, params);
    
    if (budgetResult.rows.length > 0) {
      const budgetId = budgetResult.rows[0].id;
      
      // Update the budget spend
      await updateBudgetSpend(client, budgetId);
    }
  } catch (error) {
    logger.error('Error updating matching budget spend:', error);
    throw error;
  }
}

/**
 * Record sync history
 */
async function recordSyncHistory(
  status: string,
  message: string,
  fromTimestamp: string,
  toTimestamp: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO cost_sync_history (
        id, status, message, from_timestamp, to_timestamp, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuidv4(),
        status,
        message,
        fromTimestamp,
        toTimestamp,
        new Date().toISOString()
      ]
    );
  } catch (error) {
    logger.error('Error recording sync history:', error);
    throw error;
  }
}

/**
 * Handle webhook for cost data updates
 */
export async function handleCostDataWebhook(data: any): Promise<void> {
  try {
    logger.info('Received cost data webhook');
    
    if (!data || !Array.isArray(data.records) || data.records.length === 0) {
      logger.warn('Invalid or empty webhook data');
      return;
    }
    
    // Process cost records
    await processCostRecords(data.records, 'webhook');
    
    logger.info(`Processed ${data.records.length} records from webhook`);
  } catch (error) {
    logger.error('Error handling cost data webhook:', error);
    throw error;
  }
}

/**
 * Reconcile cost data with external systems
 */
export async function reconcileCostData(): Promise<void> {
  try {
    logger.info('Starting cost data reconciliation');
    
    // Get reconciliation period (last 7 days by default)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();
    
    // Get local cost data
    const localDataResult = await query(
      `SELECT 
        request_id, provider, model, SUM(cost) as total_cost, COUNT(*) as record_count
      FROM cost_tracking
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY request_id, provider, model`,
      [startTimestamp, endTimestamp]
    );
    
    const localData = localDataResult.rows;
    
    // Get RelayCore cost data
    const relayCoreResponse = await axios.get(`${RELAYCORE_API_URL}/api/v1/cost-data/summary`, {
      params: {
        start_date: startTimestamp,
        end_date: endTimestamp,
        group_by: 'request_id,provider,model'
      }
    });
    
    const relayCoreData = relayCoreResponse.data.data || [];
    
    // Get Auterity cost data
    const auterityResponse = await axios.get(`${AUTERITY_API_URL}/api/v1/cost-data/summary`, {
      params: {
        start_date: startTimestamp,
        end_date: endTimestamp,
        group_by: 'request_id,provider,model'
      }
    });
    
    const auterityData = auterityResponse.data.data || [];
    
    // Reconcile data
    const discrepancies = [];
    
    // Check local vs RelayCore
    for (const local of localData) {
      const relayCore = relayCoreData.find(
        (r: any) => r.request_id === local.request_id && 
                   r.provider === local.provider && 
                   r.model === local.model
      );
      
      if (!relayCore || Math.abs(parseFloat(local.total_cost) - parseFloat(relayCore.total_cost)) > 0.001) {
        discrepancies.push({
          type: 'relaycore',
          request_id: local.request_id,
          provider: local.provider,
          model: local.model,
          local_cost: parseFloat(local.total_cost),
          external_cost: relayCore ? parseFloat(relayCore.total_cost) : 0,
          difference: relayCore ? 
            parseFloat(local.total_cost) - parseFloat(relayCore.total_cost) : 
            parseFloat(local.total_cost)
        });
      }
    }
    
    // Check local vs Auterity
    for (const local of localData) {
      const auterity = auterityData.find(
        (r: any) => r.request_id === local.request_id && 
                   r.provider === local.provider && 
                   r.model === local.model
      );
      
      if (!auterity || Math.abs(parseFloat(local.total_cost) - parseFloat(auterity.total_cost)) > 0.001) {
        discrepancies.push({
          type: 'auterity',
          request_id: local.request_id,
          provider: local.provider,
          model: local.model,
          local_cost: parseFloat(local.total_cost),
          external_cost: auterity ? parseFloat(auterity.total_cost) : 0,
          difference: auterity ? 
            parseFloat(local.total_cost) - parseFloat(auterity.total_cost) : 
            parseFloat(local.total_cost)
        });
      }
    }
    
    // Record reconciliation results
    await query(
      `INSERT INTO cost_reconciliation (
        id, start_timestamp, end_timestamp, total_records, discrepancy_count,
        discrepancies, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        startTimestamp,
        endTimestamp,
        localData.length,
        discrepancies.length,
        JSON.stringify(discrepancies),
        new Date().toISOString()
      ]
    );
    
    logger.info(`Cost data reconciliation completed. Found ${discrepancies.length} discrepancies out of ${localData.length} records.`);
    
    // If there are discrepancies, trigger resolution
    if (discrepancies.length > 0) {
      await resolveCostDiscrepancies(discrepancies);
    }
  } catch (error) {
    logger.error('Error reconciling cost data:', error);
    throw error;
  }
}

/**
 * Resolve cost data discrepancies
 */
async function resolveCostDiscrepancies(discrepancies: any[]): Promise<void> {
  try {
    logger.info(`Resolving ${discrepancies.length} cost data discrepancies`);
    
    // Group discrepancies by type
    const relayCoreDiscrepancies = discrepancies.filter(d => d.type === 'relaycore');
    const auterityDiscrepancies = discrepancies.filter(d => d.type === 'auterity');
    
    // Resolve RelayCore discrepancies
    if (relayCoreDiscrepancies.length > 0) {
      await axios.post(`${RELAYCORE_API_URL}/api/v1/cost-data/reconcile`, {
        discrepancies: relayCoreDiscrepancies
      });
    }
    
    // Resolve Auterity discrepancies
    if (auterityDiscrepancies.length > 0) {
      await axios.post(`${AUTERITY_API_URL}/api/v1/cost-data/reconcile`, {
        discrepancies: auterityDiscrepancies
      });
    }
    
    logger.info('Cost data discrepancies resolution initiated');
  } catch (error) {
    logger.error('Error resolving cost discrepancies:', error);
    throw error;
  }
}