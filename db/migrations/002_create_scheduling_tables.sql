-- Migration: 002_create_scheduling_tables
-- Description: Create scheduling tables for automated report generation
-- Author: AI Report Generator Team
-- Date: 2026-01-07
-- Dependencies: 001_create_core_tables.sql

-- ============================================================================
-- Table: report_schedules
-- Description: Scheduling configuration for automated report generation
-- ============================================================================

CREATE TABLE report_schedules (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,

  -- Schedule Configuration
  name VARCHAR(200) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

  -- Report Configuration
  report_config JSONB NOT NULL,

  -- Status
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status VARCHAR(50),
  last_run_error TEXT,

  -- Execution History
  total_runs INTEGER NOT NULL DEFAULT 0,
  successful_runs INTEGER NOT NULL DEFAULT 0,
  failed_runs INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT report_schedules_status_check CHECK (
    last_run_status IS NULL OR last_run_status IN ('success', 'failure', 'pending', 'timeout')
  ),
  CONSTRAINT report_schedules_runs_check CHECK (
    total_runs = successful_runs + failed_runs
  )
);

-- Comments
COMMENT ON TABLE report_schedules IS 'Cron-based scheduling for automated report generation';
COMMENT ON COLUMN report_schedules.cron_expression IS 'Standard cron format (e.g., "0 9 * * 1" = every Monday at 9 AM)';
COMMENT ON COLUMN report_schedules.report_config IS 'Complete configuration for generating the report (data sources, filters, etc.)';
COMMENT ON COLUMN report_schedules.next_run_at IS 'Pre-calculated next execution time for efficient querying';

-- ============================================================================
-- Indexes for report_schedules table
-- ============================================================================

-- User schedules lookup
CREATE INDEX idx_report_schedules_user_id ON report_schedules(user_id) WHERE deleted_at IS NULL;

-- Due schedules query (most important for scheduler execution)
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at)
  WHERE is_enabled = true AND deleted_at IS NULL;

-- Report schedules lookup
CREATE INDEX idx_report_schedules_report_id ON report_schedules(report_id) WHERE deleted_at IS NULL;

-- Failed schedules monitoring
CREATE INDEX idx_report_schedules_failures ON report_schedules(last_run_status, last_run_at)
  WHERE last_run_status = 'failure' AND deleted_at IS NULL;

-- ============================================================================
-- Triggers for report_schedules
-- ============================================================================

-- Trigger for automatic updated_at timestamp
CREATE TRIGGER report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Calculate next run time based on cron expression
-- ============================================================================

-- Note: This is a placeholder. In practice, use a library like pg_cron or
-- calculate in application code using node-cron or similar.
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_cron_expression VARCHAR,
  p_timezone VARCHAR DEFAULT 'UTC',
  p_from_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Placeholder implementation
  -- In production, integrate with pg_cron extension or calculate in application
  -- For now, return 1 hour from current time as fallback
  RETURN p_from_time + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_next_run IS 'Calculate next execution time from cron expression (placeholder - implement in application)';

-- ============================================================================
-- Function: Update schedule after execution
-- ============================================================================

CREATE OR REPLACE FUNCTION update_schedule_execution(
  p_schedule_id UUID,
  p_status VARCHAR,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE report_schedules
  SET
    last_run_at = NOW(),
    last_run_status = p_status,
    last_run_error = p_error,
    total_runs = total_runs + 1,
    successful_runs = CASE WHEN p_status = 'success' THEN successful_runs + 1 ELSE successful_runs END,
    failed_runs = CASE WHEN p_status IN ('failure', 'timeout') THEN failed_runs + 1 ELSE failed_runs END,
    next_run_at = calculate_next_run(cron_expression, timezone, NOW())
  WHERE id = p_schedule_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_schedule_execution IS 'Update schedule status after execution and calculate next run time';

-- ============================================================================
-- Sample Data (Optional - Comment out for production)
-- ============================================================================

-- Uncomment for development/testing
/*
-- Sample schedule: Daily report at 9 AM UTC
INSERT INTO report_schedules (
  user_id,
  name,
  cron_expression,
  timezone,
  report_config,
  next_run_at
) VALUES (
  'user_123',
  'Daily Sales Summary',
  '0 9 * * *',
  'UTC',
  '{
    "dataSource": "postgresql",
    "query": "SELECT * FROM sales WHERE date = CURRENT_DATE",
    "reportType": "sales_summary"
  }',
  NOW() + INTERVAL '1 day'
);

-- Sample schedule: Weekly report every Monday at 10 AM
INSERT INTO report_schedules (
  user_id,
  name,
  cron_expression,
  timezone,
  report_config,
  next_run_at
) VALUES (
  'user_123',
  'Weekly Performance Report',
  '0 10 * * 1',
  'America/New_York',
  '{
    "dataSource": "mongodb",
    "collection": "performance_metrics",
    "reportType": "weekly_performance"
  }',
  NOW() + INTERVAL '7 days'
);
*/

-- ============================================================================
-- Views for monitoring
-- ============================================================================

-- View: Active schedules with next run information
CREATE OR REPLACE VIEW v_active_schedules AS
SELECT
  s.id,
  s.name,
  s.user_id,
  s.cron_expression,
  s.timezone,
  s.is_enabled,
  s.next_run_at,
  s.last_run_at,
  s.last_run_status,
  s.total_runs,
  s.successful_runs,
  s.failed_runs,
  CASE
    WHEN s.failed_runs > 0 THEN ROUND((s.successful_runs::DECIMAL / s.total_runs) * 100, 2)
    ELSE 100.00
  END as success_rate_percent,
  EXTRACT(EPOCH FROM (s.next_run_at - NOW())) / 3600 as hours_until_next_run,
  r.title as report_title
FROM report_schedules s
LEFT JOIN reports r ON r.id = s.report_id
WHERE s.deleted_at IS NULL AND s.is_enabled = true;

COMMENT ON VIEW v_active_schedules IS 'Active schedules with calculated metrics for monitoring dashboard';

-- View: Failed schedules requiring attention
CREATE OR REPLACE VIEW v_failed_schedules AS
SELECT
  s.id,
  s.name,
  s.user_id,
  s.last_run_at,
  s.last_run_error,
  s.failed_runs,
  s.total_runs
FROM report_schedules s
WHERE
  s.deleted_at IS NULL
  AND s.last_run_status = 'failure'
  AND s.last_run_at > NOW() - INTERVAL '24 hours'
ORDER BY s.last_run_at DESC;

COMMENT ON VIEW v_failed_schedules IS 'Recently failed schedules for monitoring and alerting';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 002 completed successfully';
  RAISE NOTICE 'Tables created: report_schedules';
  RAISE NOTICE 'Indexes created: 4 total';
  RAISE NOTICE 'Functions created: 2 total';
  RAISE NOTICE 'Views created: 2 total';
END $$;
