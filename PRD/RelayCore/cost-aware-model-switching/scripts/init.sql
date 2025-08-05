-- Database schema for Cost-Aware Model Switching component

-- Budget configurations table
CREATE TABLE budget_configs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope VARCHAR(50) NOT NULL,
  scope_id VARCHAR(255) NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  period VARCHAR(20) NOT NULL,
  current_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  warning_threshold DECIMAL(5,2) NOT NULL,
  critical_threshold DECIMAL(5,2) NOT NULL,
  warning_action VARCHAR(50) NOT NULL,
  critical_action VARCHAR(50) NOT NULL,
  exhausted_action VARCHAR(50) NOT NULL,
  allow_overrides BOOLEAN NOT NULL DEFAULT FALSE,
  override_roles JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(scope, scope_id, period)
);

-- Model cost profiles table
CREATE TABLE model_cost_profiles (
  id UUID PRIMARY KEY,
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  input_token_cost DECIMAL(12,6) NOT NULL,
  output_token_cost DECIMAL(12,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  average_latency INTEGER,
  throughput INTEGER,
  capabilities JSONB,
  alternatives JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(provider, model)
);

-- Cost tracking table
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id VARCHAR(255),
  organization_id VARCHAR(255),
  team_id VARCHAR(255),
  project_id VARCHAR(255),
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(12,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  original_model VARCHAR(255),
  downgraded BOOLEAN NOT NULL DEFAULT FALSE,
  budget_status VARCHAR(50)
);

-- Budget alerts table
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budget_configs(id),
  alert_type VARCHAR(50) NOT NULL,
  threshold DECIMAL(5,2) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spend_amount DECIMAL(12,2) NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  notified_users JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (budget_id) REFERENCES budget_configs(id)
);

-- Model selection history table
CREATE TABLE model_selection_history (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id VARCHAR(255),
  organization_id VARCHAR(255),
  team_id VARCHAR(255),
  selected_model VARCHAR(255) NOT NULL,
  original_model VARCHAR(255),
  alternatives JSONB,
  selection_reason TEXT,
  budget_impact JSONB,
  estimated_cost JSONB,
  actual_cost DECIMAL(12,6),
  quality_expectation INTEGER
);

-- Token estimation cache table
CREATE TABLE token_estimation_cache (
  id UUID PRIMARY KEY,
  content_hash VARCHAR(64) NOT NULL,
  input_tokens INTEGER NOT NULL,
  estimated_output_tokens INTEGER NOT NULL,
  model VARCHAR(255),
  task_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(content_hash, model)
);

-- Model selection explanations table
CREATE TABLE model_selection_explanations (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  selected_model VARCHAR(255) NOT NULL,
  original_model VARCHAR(255),
  budget_status VARCHAR(50),
  budget_priority VARCHAR(50) NOT NULL,
  quality_requirement VARCHAR(50) NOT NULL,
  factors JSONB NOT NULL,
  comparisons JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  visualization_data JSONB NOT NULL
);

-- Cost sync history table
CREATE TABLE cost_sync_history (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  from_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  to_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Cost reconciliation table
CREATE TABLE cost_reconciliation (
  id UUID PRIMARY KEY,
  start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  total_records INTEGER NOT NULL,
  discrepancy_count INTEGER NOT NULL,
  discrepancies JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_cost_tracking_timestamp ON cost_tracking(timestamp);
CREATE INDEX idx_cost_tracking_user_id ON cost_tracking(user_id);
CREATE INDEX idx_cost_tracking_model ON cost_tracking(model);
CREATE INDEX idx_budget_configs_scope ON budget_configs(scope, scope_id);
CREATE INDEX idx_model_selection_history_timestamp ON model_selection_history(timestamp);
CREATE INDEX idx_token_estimation_cache_content_hash ON token_estimation_cache(content_hash);
CREATE INDEX idx_model_selection_explanations_request_id ON model_selection_explanations(request_id);
CREATE INDEX idx_model_selection_explanations_timestamp ON model_selection_explanations(timestamp);
CREATE INDEX idx_cost_sync_history_timestamp ON cost_sync_history(created_at);

-- Insert some initial model cost profiles
INSERT INTO model_cost_profiles (
  id, provider, model, input_token_cost, output_token_cost, currency, 
  average_latency, throughput, capabilities, updated_at, enabled
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'OpenAI',
  'gpt-4-turbo',
  0.00001,
  0.00003,
  'USD',
  500,
  1000,
  '{"text-generation": true, "code-generation": true, "function-calling": true, "reasoning": true, "math": true}',
  NOW(),
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'OpenAI',
  'gpt-3.5-turbo',
  0.0000015,
  0.000002,
  'USD',
  300,
  2000,
  '{"text-generation": true, "code-generation": true, "function-calling": true, "reasoning": true}',
  NOW(),
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'Anthropic',
  'claude-3-opus',
  0.000015,
  0.000075,
  'USD',
  600,
  800,
  '{"text-generation": true, "code-generation": true, "image-understanding": true, "reasoning": true, "math": true}',
  NOW(),
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Anthropic',
  'claude-3-sonnet',
  0.000003,
  0.000015,
  'USD',
  400,
  1200,
  '{"text-generation": true, "code-generation": true, "image-understanding": true, "reasoning": true}',
  NOW(),
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  'Anthropic',
  'claude-3-haiku',
  0.000000125,
  0.0000005,
  'USD',
  200,
  2500,
  '{"text-generation": true, "code-generation": true, "image-understanding": true}',
  NOW(),
  true
);