-- Auterity Development Database Initialization
-- This script sets up the initial database structure for development

-- Create development database if it doesn't exist
SELECT 'CREATE DATABASE auterity_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auterity_dev')\gexec

-- Connect to the development database
\c auterity_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables for development
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(organization_id);

-- Insert sample data for development
INSERT INTO organizations (name, description) VALUES
('Auterity Corp', 'Main development organization'),
('Test Organization', 'For testing purposes')
ON CONFLICT (name) DO NOTHING;

-- Insert sample user (password: dev123)
INSERT INTO users (email, username, hashed_password, is_superuser) VALUES
('admin@auterity.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMhJ6VmG', true),
('dev@auterity.com', 'developer', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMhJ6VmG', false)
ON CONFLICT (email) DO NOTHING;

-- Link users to organizations
INSERT INTO user_organizations (user_id, organization_id, role)
SELECT u.id, o.id, 'admin'
FROM users u, organizations o
WHERE u.email = 'admin@auterity.com' AND o.name = 'Auterity Corp'
ON CONFLICT (user_id, organization_id) DO NOTHING;

INSERT INTO user_organizations (user_id, organization_id, role)
SELECT u.id, o.id, 'member'
FROM users u, organizations o
WHERE u.email = 'dev@auterity.com' AND o.name = 'Test Organization'
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Create basic workflow tables
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for workflow tables
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);

-- Insert sample workflow for development
INSERT INTO workflows (name, description, definition, status, created_by, organization_id) VALUES
('Sample Workflow', 'A basic sample workflow for development', '{"nodes": [], "edges": []}', 'active',
 (SELECT id FROM users WHERE email = 'admin@auterity.com' LIMIT 1),
 (SELECT id FROM organizations WHERE name = 'Auterity Corp' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Grant permissions (for development only)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
