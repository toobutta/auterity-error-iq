/**
 * Seed Test Data Script
 * 
 * This script populates the database with test data for development and testing.
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configuration from environment variables
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cost_aware_db',
};

// Create a connection pool
const pool = new Pool(dbConfig);

/**
 * Main function to seed test data
 */
async function seedTestData() {
  console.log('Seeding test data...');
  
  try {
    // Create organizations
    const organizations = [
      { id: 'org-123', name: 'Acme Corporation' },
      { id: 'org-456', name: 'Globex Industries' },
      { id: 'org-789', name: 'Initech Technologies' }
    ];
    
    // Create teams
    const teams = [
      { id: 'team-123', name: 'Development', organizationId: 'org-123' },
      { id: 'team-456', name: 'Marketing', organizationId: 'org-123' },
      { id: 'team-789', name: 'Research', organizationId: 'org-123' },
      { id: 'team-234', name: 'Product', organizationId: 'org-456' },
      { id: 'team-567', name: 'Engineering', organizationId: 'org-456' },
      { id: 'team-890', name: 'Design', organizationId: 'org-789' }
    ];
    
    // Create users
    const users = [
      { id: 'user-123', name: 'Alice Smith', teamId: 'team-123', organizationId: 'org-123' },
      { id: 'user-456', name: 'Bob Johnson', teamId: 'team-123', organizationId: 'org-123' },
      { id: 'user-789', name: 'Carol Williams', teamId: 'team-456', organizationId: 'org-123' },
      { id: 'user-234', name: 'Dave Brown', teamId: 'team-789', organizationId: 'org-123' },
      { id: 'user-567', name: 'Eve Davis', teamId: 'team-234', organizationId: 'org-456' },
      { id: 'user-890', name: 'Frank Miller', teamId: 'team-567', organizationId: 'org-456' },
      { id: 'user-345', name: 'Grace Wilson', teamId: 'team-890', organizationId: 'org-789' }
    ];
    
    // Create budget configurations
    await seedBudgets(organizations, teams, users);
    
    // Create cost tracking records
    await seedCostTracking(organizations, teams, users);
    
    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

/**
 * Seed budget configurations
 */
async function seedBudgets(organizations, teams, users) {
  console.log('Seeding budget configurations...');
  
  // Create organization budgets
  for (const org of organizations) {
    await pool.query(
      `INSERT INTO budget_configs (
        id, name, description, scope, scope_id, limit_amount, currency, period,
        start_date, end_date, current_spend, last_updated, warning_threshold,
        critical_threshold, warning_action, critical_action, exhausted_action,
        allow_overrides, override_roles, created_at, updated_at, created_by, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        `${org.name} Monthly Budget`,
        `Monthly AI usage budget for ${org.name}`,
        'organization',
        org.id,
        5000.00, // $5,000 limit
        'USD',
        'monthly',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // First day of current month
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(), // Last day of current month
        0.00, // Current spend
        new Date().toISOString(),
        70.00, // Warning threshold
        90.00, // Critical threshold
        'notify',
        'restrict-models',
        'block-all',
        true,
        JSON.stringify(['admin']),
        new Date().toISOString(),
        new Date().toISOString(),
        'system',
        true
      ]
    );
  }
  
  // Create team budgets
  for (const team of teams) {
    await pool.query(
      `INSERT INTO budget_configs (
        id, name, description, scope, scope_id, limit_amount, currency, period,
        start_date, end_date, current_spend, last_updated, warning_threshold,
        critical_threshold, warning_action, critical_action, exhausted_action,
        allow_overrides, override_roles, created_at, updated_at, created_by, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        `${team.name} Team Monthly Budget`,
        `Monthly AI usage budget for ${team.name} team`,
        'team',
        team.id,
        1500.00, // $1,500 limit
        'USD',
        'monthly',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // First day of current month
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(), // Last day of current month
        0.00, // Current spend
        new Date().toISOString(),
        70.00, // Warning threshold
        90.00, // Critical threshold
        'notify',
        'restrict-models',
        'block-all',
        true,
        JSON.stringify(['team_lead', 'admin']),
        new Date().toISOString(),
        new Date().toISOString(),
        'system',
        true
      ]
    );
  }
  
  // Create user budgets for some users
  for (const user of users.slice(0, 3)) {
    await pool.query(
      `INSERT INTO budget_configs (
        id, name, description, scope, scope_id, limit_amount, currency, period,
        start_date, end_date, current_spend, last_updated, warning_threshold,
        critical_threshold, warning_action, critical_action, exhausted_action,
        allow_overrides, override_roles, created_at, updated_at, created_by, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        `${user.name} Personal Budget`,
        `Monthly AI usage budget for ${user.name}`,
        'user',
        user.id,
        500.00, // $500 limit
        'USD',
        'monthly',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // First day of current month
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(), // Last day of current month
        0.00, // Current spend
        new Date().toISOString(),
        70.00, // Warning threshold
        90.00, // Critical threshold
        'notify',
        'restrict-models',
        'block-all',
        false,
        JSON.stringify([]),
        new Date().toISOString(),
        new Date().toISOString(),
        'system',
        true
      ]
    );
  }
  
  console.log('Budget configurations seeded successfully!');
}

/**
 * Seed cost tracking records
 */
async function seedCostTracking(organizations, teams, users) {
  console.log('Seeding cost tracking records...');
  
  // Get all budgets
  const budgetsResult = await pool.query('SELECT * FROM budget_configs');
  const budgets = budgetsResult.rows;
  
  // Get all models
  const modelsResult = await pool.query('SELECT * FROM model_cost_profiles');
  const models = modelsResult.rows;
  
  if (models.length === 0) {
    console.warn('No models found in the database. Skipping cost tracking seeding.');
    return;
  }
  
  // Create cost tracking records for each budget
  for (const budget of budgets) {
    // Determine number of records based on budget scope
    let numRecords;
    switch (budget.scope) {
      case 'organization':
        numRecords = 100;
        break;
      case 'team':
        numRecords = 50;
        break;
      case 'user':
        numRecords = 20;
        break;
      default:
        numRecords = 10;
    }
    
    // Create records
    for (let i = 0; i < numRecords; i++) {
      // Select a random model
      const model = models[Math.floor(Math.random() * models.length)];
      
      // Determine user, team, and organization based on budget scope
      let userId, teamId, organizationId;
      
      if (budget.scope === 'user') {
        userId = budget.scope_id;
        const user = users.find(u => u.id === userId);
        teamId = user ? user.teamId : null;
        organizationId = user ? user.organizationId : null;
      } else if (budget.scope === 'team') {
        teamId = budget.scope_id;
        const team = teams.find(t => t.id === teamId);
        organizationId = team ? team.organizationId : null;
        
        // Select a random user from the team
        const teamUsers = users.filter(u => u.teamId === teamId);
        if (teamUsers.length > 0) {
          userId = teamUsers[Math.floor(Math.random() * teamUsers.length)].id;
        }
      } else if (budget.scope === 'organization') {
        organizationId = budget.scope_id;
        
        // Select a random team from the organization
        const orgTeams = teams.filter(t => t.organizationId === organizationId);
        if (orgTeams.length > 0) {
          teamId = orgTeams[Math.floor(Math.random() * orgTeams.length)].id;
          
          // Select a random user from the team
          const teamUsers = users.filter(u => u.teamId === teamId);
          if (teamUsers.length > 0) {
            userId = teamUsers[Math.floor(Math.random() * teamUsers.length)].id;
          }
        }
      }
      
      // Generate random input and output tokens
      const inputTokens = Math.floor(Math.random() * 1000) + 100;
      const outputTokens = Math.floor(Math.random() * 2000) + 200;
      
      // Calculate cost
      const inputCost = inputTokens * parseFloat(model.input_token_cost);
      const outputCost = outputTokens * parseFloat(model.output_token_cost);
      const totalCost = inputCost + outputCost;
      
      // Generate random timestamp within the current month
      const startDate = new Date(budget.start_date);
      const endDate = new Date();
      if (endDate > new Date(budget.end_date)) {
        endDate.setTime(new Date(budget.end_date).getTime());
      }
      
      const timestamp = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      ).toISOString();
      
      // Insert cost tracking record
      await pool.query(
        `INSERT INTO cost_tracking (
          id, budget_id, request_id, user_id, organization_id, team_id,
          provider, model, input_tokens, output_tokens, cost, currency,
          timestamp, original_model, downgraded, budget_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          uuidv4(),
          budget.id,
          uuidv4(),
          userId,
          organizationId,
          teamId,
          model.provider,
          model.model,
          inputTokens,
          outputTokens,
          totalCost,
          model.currency,
          timestamp,
          null,
          false,
          'normal'
        ]
      );
    }
    
    // Update budget current spend
    const spendResult = await pool.query(
      `SELECT SUM(cost) as total_cost
       FROM cost_tracking
       WHERE budget_id = $1`,
      [budget.id]
    );
    
    const currentSpend = parseFloat(spendResult.rows[0]?.total_cost || '0');
    
    await pool.query(
      `UPDATE budget_configs
       SET current_spend = $1, last_updated = $2
       WHERE id = $3`,
      [currentSpend, new Date().toISOString(), budget.id]
    );
    
    // Create alerts if thresholds are crossed
    const percentUsed = (currentSpend / parseFloat(budget.limit_amount)) * 100;
    
    if (percentUsed >= parseFloat(budget.warning_threshold)) {
      await pool.query(
        `INSERT INTO budget_alerts (
          id, budget_id, alert_type, threshold, triggered_at,
          spend_amount, limit_amount, percentage, notified_users,
          resolved, resolved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          budget.id,
          'warning',
          parseFloat(budget.warning_threshold),
          new Date().toISOString(),
          currentSpend,
          parseFloat(budget.limit_amount),
          percentUsed,
          JSON.stringify([]),
          false,
          null
        ]
      );
    }
    
    if (percentUsed >= parseFloat(budget.critical_threshold)) {
      await pool.query(
        `INSERT INTO budget_alerts (
          id, budget_id, alert_type, threshold, triggered_at,
          spend_amount, limit_amount, percentage, notified_users,
          resolved, resolved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          budget.id,
          'critical',
          parseFloat(budget.critical_threshold),
          new Date().toISOString(),
          currentSpend,
          parseFloat(budget.limit_amount),
          percentUsed,
          JSON.stringify([]),
          false,
          null
        ]
      );
    }
    
    if (percentUsed >= 100) {
      await pool.query(
        `INSERT INTO budget_alerts (
          id, budget_id, alert_type, threshold, triggered_at,
          spend_amount, limit_amount, percentage, notified_users,
          resolved, resolved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          budget.id,
          'exceeded',
          100,
          new Date().toISOString(),
          currentSpend,
          parseFloat(budget.limit_amount),
          percentUsed,
          JSON.stringify([]),
          false,
          null
        ]
      );
    }
  }
  
  console.log('Cost tracking records seeded successfully!');
}

// Run the seed function
seedTestData().catch(console.error);