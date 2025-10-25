-- Unified Database Initialization for Three-System AI Platform
-- Creates separate schemas for AutoMatrix, RelayCore, and NeuroWeaver

-- Create schemas for each system
CREATE SCHEMA IF NOT EXISTS autmatrix;
CREATE SCHEMA IF NOT EXISTS relaycore;
CREATE SCHEMA IF NOT EXISTS neuroweaver;
CREATE SCHEMA IF NOT EXISTS shared;

-- Grant permissions to postgres user for all schemas
GRANT ALL PRIVILEGES ON SCHEMA autmatrix TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA relaycore TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA neuroweaver TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA shared TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA autmatrix GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA relaycore GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA neuroweaver GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shared GRANT ALL ON TABLES TO postgres;

-- Create shared tables for cross-system functionality
CREATE TABLE IF NOT EXISTS shared.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES shared.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.ai_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES shared.users(id),
    system_source VARCHAR(50) NOT NULL, -- 'autmatrix', 'relaycore', 'neuroweaver'
    request_data JSONB NOT NULL,
    response_data JSONB,
    model_used VARCHAR(100),
    cost DECIMAL(10,4),
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.system_metrics (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON shared.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_system_source ON shared.ai_requests(system_source);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON shared.ai_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON shared.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON shared.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_system_metrics_system_name ON shared.system_metrics(system_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON shared.system_metrics(recorded_at);

-- Insert default admin user (password: admin123)
INSERT INTO shared.users (username, email, hashed_password)
VALUES ('admin', 'admin@autmatrix.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L3jzjvG4e')
ON CONFLICT (username) DO NOTHING;

COMMIT;
