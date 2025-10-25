-- Initialize Auterity AI Platform Database
-- This script sets up the pgvector extension and initial database configuration

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a test table to verify pgvector is working
CREATE TABLE IF NOT EXISTS test_vectors (
    id SERIAL PRIMARY KEY,
    embedding vector(384),
    metadata JSONB
);

-- Insert a test vector to verify functionality
INSERT INTO test_vectors (embedding, metadata) VALUES
    ('[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]'::vector, '{"test": true}');

-- Create a simple similarity search function for testing
CREATE OR REPLACE FUNCTION test_similarity(a vector, b vector)
RETURNS float AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql;

-- Verify pgvector is working
SELECT test_similarity(
    '[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]'::vector,
    '[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]'::vector
) as similarity_score;

-- Clean up test data
DROP TABLE test_vectors;
DROP FUNCTION test_similarity;
