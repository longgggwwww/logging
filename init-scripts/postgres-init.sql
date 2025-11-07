-- Migration script for Log Processor Database
-- Run this to set up the database schema manually if needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on projects.name
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Create functions table
CREATE TABLE IF NOT EXISTS functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);

-- Create indexes on functions
CREATE INDEX IF NOT EXISTS idx_functions_project_id ON functions(project_id);
CREATE INDEX IF NOT EXISTS idx_functions_name ON functions(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_functions_project_name ON functions(project_id, name);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
    
    -- Log information
    method VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    
    -- Request information
    request_headers JSONB,
    request_user_agent TEXT,
    request_url TEXT,
    request_params JSONB,
    request_body JSONB,
    
    -- Response information
    response_code INTEGER,
    response_success BOOLEAN,
    response_message TEXT,
    response_data JSONB,
    
    -- Additional information
    console_log TEXT,
    additional_data JSONB,
    latency INTEGER,
    
    -- User information
    created_by_id VARCHAR(255),
    created_by_fullname VARCHAR(255),
    created_by_empl_code VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP(3) NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on logs table
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_function_id ON logs(function_id);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_method ON logs(method);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_response_code ON logs(response_code);
CREATE INDEX IF NOT EXISTS idx_logs_created_by_id ON logs(created_by_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_logs_project_function ON logs(project_id, function_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_type ON logs(project_id, type);
CREATE INDEX IF NOT EXISTS idx_logs_project_created ON logs(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_function_type ON logs(function_id, type);

-- Create trigger for updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on functions
CREATE TRIGGER update_functions_updated_at BEFORE UPDATE ON functions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on logs
CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for verification
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM functions;
-- SELECT COUNT(*) FROM logs;

-- View table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;