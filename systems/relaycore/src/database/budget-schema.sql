-- Budget Management System Database Schema
-- Enhanced budget tracking with hierarchical support, alerts, and usage records

-- Drop existing budget_tracking table if it exists (for migration)
-- DROP TABLE IF EXISTS budget_tracking;

-- Budget Definitions Table
CREATE TABLE IF NOT EXISTS budget_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'team', 'user', 'project')),
    scope_id VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    recurring BOOLEAN DEFAULT false,
    alerts JSONB DEFAULT '[]',
    tags JSONB DEFAULT '{}',
    parent_budget_id UUID REFERENCES budget_definitions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Budget Usage Records Table
CREATE TABLE IF NOT EXISTS budget_usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budget_definitions(id) ON DELETE CASCADE,
    amount DECIMAL(12, 6) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('relaycore', 'auterity', 'manual')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Alert History Table
CREATE TABLE IF NOT EXISTS budget_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budget_definitions(id) ON DELETE CASCADE,
    threshold DECIMAL(5, 2) NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actions JSONB NOT NULL DEFAULT '[]',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Status Cache Table (for performance optimization)
CREATE TABLE IF NOT EXISTS budget_status_cache (
    budget_id UUID PRIMARY KEY REFERENCES budget_definitions(id) ON DELETE CASCADE,
    current_amount DECIMAL(12, 6) NOT NULL DEFAULT 0,
    percent_used DECIMAL(5, 2) NOT NULL DEFAULT 0,
    remaining DECIMAL(12, 6) NOT NULL DEFAULT 0,
    days_remaining INTEGER,
    burn_rate DECIMAL(12, 6) DEFAULT 0,
    projected_total DECIMAL(12, 6) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'exceeded')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_budget_definitions_scope ON budget_definitions(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_budget_definitions_active ON budget_definitions(active);
CREATE INDEX IF NOT EXISTS idx_budget_definitions_parent ON budget_definitions(parent_budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_definitions_period ON budget_definitions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budget_definitions_created_by ON budget_definitions(created_by);

CREATE INDEX IF NOT EXISTS idx_budget_usage_budget_id ON budget_usage_records(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_usage_timestamp ON budget_usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_budget_usage_source ON budget_usage_records(source);
CREATE INDEX IF NOT EXISTS idx_budget_usage_budget_timestamp ON budget_usage_records(budget_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_budget_alert_budget_id ON budget_alert_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alert_triggered ON budget_alert_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_budget_alert_acknowledged ON budget_alert_history(acknowledged);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budget_definitions_updated_at 
    BEFORE UPDATE ON budget_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate budget status
CREATE OR REPLACE FUNCTION calculate_budget_status(budget_uuid UUID)
RETURNS TABLE (
    current_amount DECIMAL(12, 6),
    percent_used DECIMAL(5, 2),
    remaining DECIMAL(12, 6),
    days_remaining INTEGER,
    burn_rate DECIMAL(12, 6),
    projected_total DECIMAL(12, 6),
    status VARCHAR(20)
) AS $$
DECLARE
    budget_record budget_definitions%ROWTYPE;
    total_usage DECIMAL(12, 6);
    days_elapsed INTEGER;
    total_days INTEGER;
    calculated_burn_rate DECIMAL(12, 6);
    calculated_projected DECIMAL(12, 6);
    calculated_status VARCHAR(20);
BEGIN
    -- Get budget definition
    SELECT * INTO budget_record FROM budget_definitions WHERE id = budget_uuid AND active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate total usage
    SELECT COALESCE(SUM(amount), 0) INTO total_usage
    FROM budget_usage_records 
    WHERE budget_id = budget_uuid 
    AND timestamp >= budget_record.start_date 
    AND (budget_record.end_date IS NULL OR timestamp <= budget_record.end_date);
    
    -- Calculate time metrics
    days_elapsed := GREATEST(1, EXTRACT(DAY FROM CURRENT_TIMESTAMP - budget_record.start_date)::INTEGER);
    
    IF budget_record.end_date IS NOT NULL THEN
        total_days := EXTRACT(DAY FROM budget_record.end_date - budget_record.start_date)::INTEGER;
        days_remaining := GREATEST(0, EXTRACT(DAY FROM budget_record.end_date - CURRENT_TIMESTAMP)::INTEGER);
    ELSE
        -- For recurring budgets without end date, use period-based calculation
        CASE budget_record.period
            WHEN 'daily' THEN total_days := 1;
            WHEN 'weekly' THEN total_days := 7;
            WHEN 'monthly' THEN total_days := 30;
            WHEN 'quarterly' THEN total_days := 90;
            WHEN 'annual' THEN total_days := 365;
            ELSE total_days := 30; -- default to monthly
        END CASE;
        days_remaining := total_days - (days_elapsed % total_days);
    END IF;
    
    -- Calculate burn rate and projections
    calculated_burn_rate := total_usage / GREATEST(1, days_elapsed);
    calculated_projected := calculated_burn_rate * GREATEST(1, total_days);
    
    -- Determine status
    IF total_usage >= budget_record.amount THEN
        calculated_status := 'exceeded';
    ELSIF (total_usage / budget_record.amount) >= 0.95 THEN
        calculated_status := 'critical';
    ELSIF (total_usage / budget_record.amount) >= 0.80 THEN
        calculated_status := 'warning';
    ELSE
        calculated_status := 'normal';
    END IF;
    
    -- Return calculated values
    current_amount := total_usage;
    percent_used := ROUND((total_usage / budget_record.amount) * 100, 2);
    remaining := GREATEST(0, budget_record.amount - total_usage);
    burn_rate := calculated_burn_rate;
    projected_total := calculated_projected;
    status := calculated_status;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh budget status cache
CREATE OR REPLACE FUNCTION refresh_budget_status_cache(budget_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    budget_id_to_update UUID;
    status_record RECORD;
BEGIN
    -- If specific budget ID provided, update only that one
    IF budget_uuid IS NOT NULL THEN
        FOR status_record IN SELECT * FROM calculate_budget_status(budget_uuid) LOOP
            INSERT INTO budget_status_cache (
                budget_id, current_amount, percent_used, remaining, 
                days_remaining, burn_rate, projected_total, status, last_updated
            ) VALUES (
                budget_uuid, status_record.current_amount, status_record.percent_used, 
                status_record.remaining, status_record.days_remaining, status_record.burn_rate, 
                status_record.projected_total, status_record.status, CURRENT_TIMESTAMP
            )
            ON CONFLICT (budget_id) DO UPDATE SET
                current_amount = EXCLUDED.current_amount,
                percent_used = EXCLUDED.percent_used,
                remaining = EXCLUDED.remaining,
                days_remaining = EXCLUDED.days_remaining,
                burn_rate = EXCLUDED.burn_rate,
                projected_total = EXCLUDED.projected_total,
                status = EXCLUDED.status,
                last_updated = EXCLUDED.last_updated;
        END LOOP;
    ELSE
        -- Update all active budgets
        FOR budget_id_to_update IN SELECT id FROM budget_definitions WHERE active = true LOOP
            FOR status_record IN SELECT * FROM calculate_budget_status(budget_id_to_update) LOOP
                INSERT INTO budget_status_cache (
                    budget_id, current_amount, percent_used, remaining, 
                    days_remaining, burn_rate, projected_total, status, last_updated
                ) VALUES (
                    budget_id_to_update, status_record.current_amount, status_record.percent_used, 
                    status_record.remaining, status_record.days_remaining, status_record.burn_rate, 
                    status_record.projected_total, status_record.status, CURRENT_TIMESTAMP
                )
                ON CONFLICT (budget_id) DO UPDATE SET
                    current_amount = EXCLUDED.current_amount,
                    percent_used = EXCLUDED.percent_used,
                    remaining = EXCLUDED.remaining,
                    days_remaining = EXCLUDED.days_remaining,
                    burn_rate = EXCLUDED.burn_rate,
                    projected_total = EXCLUDED.projected_total,
                    status = EXCLUDED.status,
                    last_updated = EXCLUDED.last_updated;
            END LOOP;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update budget status cache when usage is recorded
CREATE OR REPLACE FUNCTION trigger_budget_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the cache for the affected budget
    PERFORM refresh_budget_status_cache(NEW.budget_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_status_on_usage
    AFTER INSERT OR UPDATE ON budget_usage_records
    FOR EACH ROW EXECUTE FUNCTION trigger_budget_status_update();