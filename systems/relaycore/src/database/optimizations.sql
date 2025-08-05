-- RelayCore Database Optimizations
-- Performance tuning for high-throughput AI request routing and budget management

-- Optimize AI request logging and metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_requests_timestamp_model 
ON ai_requests(timestamp DESC, model_used);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cost_tracking_user_date 
ON cost_tracking(user_id, date DESC);

-- Partitioning for large tables
-- Note: This requires the table to be created with partitioning enabled
DO $$
BEGIN
  -- Check if table exists and is not already partitioned
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'ai_requests'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT FROM pg_partitioned_table pt
    JOIN pg_class pc ON pt.partrelid = pc.oid
    WHERE pc.relname = 'ai_requests'
  ) THEN
    -- Create partitioned table
    CREATE TABLE ai_requests_partitioned (
      id UUID NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      model_used VARCHAR(255) NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT,
      tokens_used INTEGER,
      cost DECIMAL(12, 6),
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      metadata JSONB DEFAULT '{}'
    ) PARTITION BY RANGE (timestamp);
    
    -- Create partitions for current and next month
    CREATE TABLE ai_requests_2024_01 PARTITION OF ai_requests_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
    
    CREATE TABLE ai_requests_2024_02 PARTITION OF ai_requests_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
    
    -- Create indexes on partitions
    CREATE INDEX ON ai_requests_2024_01 (user_id, timestamp DESC);
    CREATE INDEX ON ai_requests_2024_01 (model_used, timestamp DESC);
    
    CREATE INDEX ON ai_requests_2024_02 (user_id, timestamp DESC);
    CREATE INDEX ON ai_requests_2024_02 (model_used, timestamp DESC);
    
    -- Note: In production, you would migrate data from the old table to the new partitioned table
    -- and then rename tables to complete the migration
  END IF;
END $$;

-- Optimize budget management queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_usage_records_budget_timestamp 
ON budget_usage_records(budget_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_usage_records_metadata 
ON budget_usage_records USING GIN (metadata jsonb_path_ops);

-- Create partial index for active budgets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_definitions_active_scope 
ON budget_definitions(scope_type, scope_id) 
WHERE active = true;

-- Create index for budget status lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_status_cache_status 
ON budget_status_cache(status, last_updated DESC);

-- Optimize performance metrics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_type_timestamp 
ON performance_metrics(metric_type, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_system_type 
ON performance_metrics(system, metric_type, timestamp DESC);

-- Create materialized view for common budget reports
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_budget_usage AS
SELECT 
  budget_id,
  DATE_TRUNC('day', timestamp) AS day,
  SUM(amount) AS daily_amount,
  COUNT(*) AS usage_count,
  MIN(amount) AS min_amount,
  MAX(amount) AS max_amount,
  AVG(amount) AS avg_amount
FROM 
  budget_usage_records
WHERE 
  timestamp > CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
  budget_id, DATE_TRUNC('day', timestamp)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_budget_usage 
ON mv_daily_budget_usage(budget_id, day);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_budget_usage_mv()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_budget_usage;
END;
$$ LANGUAGE plpgsql;

-- Create a job to refresh the materialized view daily
DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule daily refresh at 2 AM
    PERFORM cron.schedule('0 2 * * *', 'SELECT refresh_budget_usage_mv()');
  END IF;
END $$;

-- Optimize query performance with table statistics
ANALYZE budget_definitions;
ANALYZE budget_usage_records;
ANALYZE budget_status_cache;
ANALYZE budget_alert_history;
ANALYZE performance_metrics;

-- Create function to automatically analyze tables with high update frequency
CREATE OR REPLACE FUNCTION auto_analyze_tables()
RETURNS VOID AS $$
BEGIN
  -- Analyze tables that have high update frequency
  ANALYZE budget_usage_records;
  ANALYZE budget_status_cache;
  ANALYZE performance_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create a job to auto-analyze tables hourly
DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule hourly analysis
    PERFORM cron.schedule('0 * * * *', 'SELECT auto_analyze_tables()');
  END IF;
END $$;

-- Create cache tables for frequently accessed data
CREATE TABLE IF NOT EXISTS api_response_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_api_response_cache_expires 
ON api_response_cache(expires_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_response_cache 
  WHERE expires_at < CURRENT_TIMESTAMP
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a job to clean expired cache entries every 5 minutes
DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule cache cleanup
    PERFORM cron.schedule('*/5 * * * *', 'SELECT clean_expired_cache()');
  END IF;
END $$;

-- Create configuration table for cache settings
CREATE TABLE IF NOT EXISTS cache_config (
  path VARCHAR(255) PRIMARY KEY,
  ttl_seconds INTEGER NOT NULL DEFAULT 300,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_cache_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cache_config_timestamp
BEFORE UPDATE ON cache_config
FOR EACH ROW EXECUTE FUNCTION update_cache_config_timestamp();

-- Create table for slow query logging
CREATE TABLE IF NOT EXISTS slow_query_log (
  id SERIAL PRIMARY KEY,
  query_text TEXT NOT NULL,
  avg_time FLOAT NOT NULL,
  calls INTEGER NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT
);

-- Create table for query optimizations
CREATE TABLE IF NOT EXISTS query_optimizations (
  id SERIAL PRIMARY KEY,
  original_query TEXT NOT NULL,
  optimized_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  applied BOOLEAN DEFAULT false,
  performance_improvement FLOAT
);

-- Create table for cost prediction accuracy tracking
CREATE TABLE IF NOT EXISTS cost_prediction_accuracy (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(255) NOT NULL,
  predicted_cost DECIMAL(12, 6) NOT NULL,
  actual_cost DECIMAL(12, 6) NOT NULL,
  prediction_error FLOAT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_prediction_accuracy_model 
ON cost_prediction_accuracy(model_id, timestamp DESC);

-- Create table for model steering rules
CREATE TABLE IF NOT EXISTS model_steering_rules (
  id SERIAL PRIMARY KEY,
  source_model VARCHAR(255) NOT NULL UNIQUE,
  target_model VARCHAR(255) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_model_steering_rules_source 
ON model_steering_rules(source_model) WHERE active = true;

-- Create table for performance alerts
CREATE TABLE IF NOT EXISTS performance_alerts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  threshold FLOAT NOT NULL,
  operator VARCHAR(10) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- Create table for performance alert history
CREATE TABLE IF NOT EXISTS performance_alert_history (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(255) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  threshold FLOAT NOT NULL,
  value FLOAT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_alert_history_alert 
ON performance_alert_history(alert_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_alert_history_active 
ON performance_alert_history(resolved_at) 
WHERE resolved_at IS NULL;

-- Create table for API request logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time FLOAT NOT NULL,
  user_id VARCHAR(255),
  ip_address VARCHAR(45),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_path_method 
ON api_request_logs(path, method, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_response_time 
ON api_request_logs(response_time DESC, timestamp DESC);