-- RelayCore Database Schema
-- AI request metrics and routing data

-- Create database if not exists (run manually)
-- CREATE DATABASE relaycore;

-- AI Request Metrics Table
CREATE TABLE IF NOT EXISTS ai_request_metrics (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255),
    system_source VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_type VARCHAR(100),
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    routing_decision JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_metrics_timestamp ON ai_request_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user_id ON ai_request_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_provider ON ai_request_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_model ON ai_request_metrics(model);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_success ON ai_request_metrics(success);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_system_source ON ai_request_metrics(system_source);

-- Steering Rules Table
CREATE TABLE IF NOT EXISTS steering_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Provider Status Table
CREATE TABLE IF NOT EXISTS provider_status (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE,
    available BOOLEAN DEFAULT true,
    response_time_ms INTEGER DEFAULT 0,
    error_rate DECIMAL(5, 4) DEFAULT 0,
    cost_per_token DECIMAL(10, 8) DEFAULT 0,
    models JSONB,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Tracking Table
CREATE TABLE IF NOT EXISTS budget_tracking (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    budget_limit DECIMAL(10, 2) NOT NULL,
    used_amount DECIMAL(10, 2) DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for budget tracking
CREATE INDEX IF NOT EXISTS idx_budget_user_id ON budget_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_period ON budget_tracking(period_start, period_end);

-- Cost History Table (for optimization algorithms)
CREATE TABLE IF NOT EXISTS cost_history (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    cost DECIMAL(10, 6) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cost history
CREATE INDEX IF NOT EXISTS idx_cost_history_provider_model ON cost_history(provider, model);
CREATE INDEX IF NOT EXISTS idx_cost_history_timestamp ON cost_history(timestamp);

-- Insert default steering rules
INSERT INTO steering_rules (name, description, conditions, actions, priority, enabled) VALUES
('Automotive Context Routing', 'Route automotive-related requests to NeuroWeaver', 
 '[{"field": "context.automotive_context", "operator": "exists", "value": true}]',
 '[{"type": "route_to_provider", "parameters": {"provider": "neuroweaver", "model": "automotive-specialist-v1"}}]',
 10, true),
('Cost Optimization', 'Use cheaper models for simple requests',
 '[{"field": "prompt", "operator": "less_than", "value": 100}]',
 '[{"type": "route_to_provider", "parameters": {"provider": "openai", "model": "gpt-3.5-turbo"}}]',
 5, true),
('High Priority Routing', 'Use best models for high priority requests',
 '[{"field": "context.priority", "operator": "equals", "value": "high"}]',
 '[{"type": "route_to_provider", "parameters": {"provider": "openai", "model": "gpt-4"}}]',
 15, true)
ON CONFLICT DO NOTHING;

-- Insert default provider status
INSERT INTO provider_status (provider, available, cost_per_token, models) VALUES
('openai', true, 0.002, '["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview"]'),
('anthropic', true, 0.0015, '["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"]'),
('neuroweaver', true, 0.001, '["automotive-specialist-v1", "service-advisor-v1", "parts-specialist-v1"]')
ON CONFLICT (provider) DO UPDATE SET
    models = EXCLUDED.models,
    cost_per_token = EXCLUDED.cost_per_token,
    updated_at = CURRENT_TIMESTAMP;