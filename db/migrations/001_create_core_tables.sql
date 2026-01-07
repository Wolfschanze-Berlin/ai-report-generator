-- Migration: 001_create_core_tables
-- Description: Create core report storage tables with version history and metadata
-- Author: AI Report Generator Team
-- Date: 2026-01-07

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: reports
-- Description: Primary table for storing active reports
-- ============================================================================

CREATE TABLE reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255),

  -- Basic Info
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Report Content (Full JSON)
  content JSONB NOT NULL,

  -- Version Control
  version INTEGER NOT NULL DEFAULT 1,
  is_latest_version BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  data_source VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT reports_version_check CHECK (version > 0)
);

-- Comments
COMMENT ON TABLE reports IS 'Primary storage for AI-generated reports with full JSON content';
COMMENT ON COLUMN reports.content IS 'Full Report JSON following report-schema.md specification';
COMMENT ON COLUMN reports.version IS 'Current version number, increments with each update';
COMMENT ON COLUMN reports.deleted_at IS 'Soft delete timestamp, NULL indicates active report';

-- ============================================================================
-- Indexes for reports table
-- ============================================================================

-- User reports lookup (most common query)
CREATE INDEX idx_reports_user_id ON reports(user_id) WHERE deleted_at IS NULL;

-- Recent reports
CREATE INDEX idx_reports_created_at ON reports(created_at DESC) WHERE deleted_at IS NULL;

-- Tag-based filtering (GIN index for array operations)
CREATE INDEX idx_reports_tags ON reports USING GIN(tags);

-- Category filtering
CREATE INDEX idx_reports_category ON reports(category) WHERE deleted_at IS NULL;

-- JSONB content queries (GIN index for JSONB operations)
CREATE INDEX idx_reports_content ON reports USING GIN(content);

-- Organization filtering (for multi-tenant support)
CREATE INDEX idx_reports_organization_id ON reports(organization_id) WHERE deleted_at IS NULL;

-- Full-text search index (combines title, description, and content)
CREATE INDEX idx_reports_fts ON reports USING GIN(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(content::text, '')
  )
) WHERE deleted_at IS NULL;

-- ============================================================================
-- Table: report_versions
-- Description: Complete version history for all report changes
-- ============================================================================

CREATE TABLE report_versions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- Version Info
  version INTEGER NOT NULL,

  -- Content Snapshot
  content JSONB NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Change Tracking
  change_summary TEXT,
  changed_by VARCHAR(255) NOT NULL,
  change_type VARCHAR(50) NOT NULL DEFAULT 'update',

  -- Diff (optional - stores only changes for space efficiency)
  content_diff JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT report_versions_version_check CHECK (version > 0),
  CONSTRAINT report_versions_change_type_check CHECK (
    change_type IN ('create', 'update', 'restore', 'schedule', 'system')
  ),

  -- Unique constraint: one version per report per version number
  UNIQUE(report_id, version)
);

-- Comments
COMMENT ON TABLE report_versions IS 'Complete version history with snapshots for audit and rollback';
COMMENT ON COLUMN report_versions.content IS 'Full snapshot of report content at this version';
COMMENT ON COLUMN report_versions.change_type IS 'Type of change: create, update, restore, schedule, system';
COMMENT ON COLUMN report_versions.content_diff IS 'Optional JSON patch format for efficient storage';

-- ============================================================================
-- Indexes for report_versions table
-- ============================================================================

-- Version history lookup (most common query)
CREATE INDEX idx_report_versions_report_id ON report_versions(report_id, version DESC);

-- Audit trail by time
CREATE INDEX idx_report_versions_created_at ON report_versions(created_at DESC);

-- Audit trail by user
CREATE INDEX idx_report_versions_changed_by ON report_versions(changed_by);

-- ============================================================================
-- Table: report_metadata
-- Description: Extended metadata and analytics for reports
-- ============================================================================

CREATE TABLE report_metadata (
  -- Primary Key (one-to-one with reports)
  report_id UUID PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,

  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  export_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  last_exported_at TIMESTAMP WITH TIME ZONE,

  -- User Engagement
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  favorite_count INTEGER NOT NULL DEFAULT 0,

  -- Generation Metadata
  generation_time_ms INTEGER,
  data_source_info JSONB,
  ai_model VARCHAR(100),
  ai_prompt TEXT,

  -- Quality Metrics
  component_count INTEGER,
  data_point_count INTEGER,

  -- Custom Fields (extensible)
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT report_metadata_view_count_check CHECK (view_count >= 0),
  CONSTRAINT report_metadata_export_count_check CHECK (export_count >= 0),
  CONSTRAINT report_metadata_favorite_count_check CHECK (favorite_count >= 0)
);

-- Comments
COMMENT ON TABLE report_metadata IS 'Analytics and extended metadata for reports';
COMMENT ON COLUMN report_metadata.data_source_info IS 'JSONB containing data source details and connection info';
COMMENT ON COLUMN report_metadata.custom_fields IS 'Extensible JSONB field for future metadata additions';

-- ============================================================================
-- Indexes for report_metadata table
-- ============================================================================

-- Favorite reports lookup
CREATE INDEX idx_report_metadata_favorite ON report_metadata(is_favorite) WHERE is_favorite = true;

-- Popular reports by views
CREATE INDEX idx_report_metadata_view_count ON report_metadata(view_count DESC);

-- Recently viewed reports
CREATE INDEX idx_report_metadata_last_viewed ON report_metadata(last_viewed_at DESC) WHERE last_viewed_at IS NOT NULL;

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reports table
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for report_metadata table
CREATE TRIGGER report_metadata_updated_at
  BEFORE UPDATE ON report_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Create report version on update
-- ============================================================================

CREATE OR REPLACE FUNCTION create_report_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content or title changed
  IF (OLD.content IS DISTINCT FROM NEW.content) OR (OLD.title IS DISTINCT FROM NEW.title) THEN
    INSERT INTO report_versions (
      report_id,
      version,
      content,
      title,
      description,
      changed_by,
      change_type,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.content,
      NEW.title,
      NEW.description,
      COALESCE(current_setting('app.current_user_id', true), NEW.user_id),
      'update',
      'Report content or title updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create versions on update
CREATE TRIGGER reports_create_version
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION create_report_version();

-- ============================================================================
-- Function: Create metadata row on report creation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_report_metadata()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO report_metadata (report_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create metadata row
CREATE TRIGGER reports_create_metadata
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION create_report_metadata();

-- ============================================================================
-- Sample Data (Optional - Comment out for production)
-- ============================================================================

-- Uncomment for development/testing
/*
INSERT INTO reports (user_id, title, description, content, tags, category) VALUES
  (
    'user_123',
    'Q4 Sales Performance Report',
    'Comprehensive sales analysis for Q4 2025',
    '{"version": "1.0", "components": [{"id": "kpi1", "type": "kpi", "data": {"value": 125000, "label": "Total Revenue"}}]}',
    ARRAY['sales', 'quarterly', 'performance'],
    'sales'
  ),
  (
    'user_123',
    'Marketing Campaign Analysis',
    'ROI analysis for November marketing campaigns',
    '{"version": "1.0", "components": [{"id": "chart1", "type": "chart", "data": {"type": "bar"}}]}',
    ARRAY['marketing', 'roi', 'campaigns'],
    'marketing'
  );
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Migration 001 completed successfully';
  RAISE NOTICE 'Tables created: reports, report_versions, report_metadata';
  RAISE NOTICE 'Indexes created: 13 total';
  RAISE NOTICE 'Triggers created: 4 total';
END $$;
