-- Migration: 003_create_social_tables
-- Description: Create tables for social features (favorites and sharing)
-- Author: AI Report Generator Team
-- Date: 2026-01-07
-- Dependencies: 001_create_core_tables.sql

-- ============================================================================
-- Table: report_favorites
-- Description: User-specific favorites for multi-user support
-- ============================================================================

CREATE TABLE report_favorites (
  -- Composite Primary Key
  user_id VARCHAR(255) NOT NULL,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- Custom Organization
  sort_order INTEGER,
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Primary Key
  PRIMARY KEY (user_id, report_id)
);

-- Comments
COMMENT ON TABLE report_favorites IS 'User-specific favorites with custom ordering';
COMMENT ON COLUMN report_favorites.sort_order IS 'Custom sort order for favorites list (lower values appear first)';
COMMENT ON COLUMN report_favorites.notes IS 'User notes about why they favorited this report';

-- ============================================================================
-- Indexes for report_favorites table
-- ============================================================================

-- User favorites lookup (most common query)
CREATE INDEX idx_report_favorites_user_id ON report_favorites(user_id, created_at DESC);

-- Favorites with custom sort order
CREATE INDEX idx_report_favorites_sort_order ON report_favorites(user_id, sort_order)
  WHERE sort_order IS NOT NULL;

-- Report popularity (count of favorites per report)
CREATE INDEX idx_report_favorites_report_id ON report_favorites(report_id);

-- ============================================================================
-- Table: report_shares
-- Description: Sharing and permissions for reports
-- ============================================================================

CREATE TABLE report_shares (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  shared_by VARCHAR(255) NOT NULL,
  shared_with VARCHAR(255) NOT NULL,

  -- Permissions
  permission_level VARCHAR(20) NOT NULL DEFAULT 'view',

  -- Share Link (optional for anonymous sharing)
  share_token VARCHAR(100) UNIQUE,
  share_link_expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT report_shares_permission_check CHECK (
    permission_level IN ('view', 'edit', 'admin')
  ),
  CONSTRAINT report_shares_self_share_check CHECK (shared_by != shared_with),
  CONSTRAINT report_shares_expiry_check CHECK (
    share_link_expires_at IS NULL OR share_link_expires_at > created_at
  )
);

-- Comments
COMMENT ON TABLE report_shares IS 'Report sharing with granular permissions';
COMMENT ON COLUMN report_shares.permission_level IS 'Permission level: view (read-only), edit (modify), admin (full control)';
COMMENT ON COLUMN report_shares.share_token IS 'Unique token for shareable links (optional for anonymous sharing)';
COMMENT ON COLUMN report_shares.revoked_at IS 'Timestamp when share was revoked (NULL = active share)';

-- ============================================================================
-- Indexes for report_shares table
-- ============================================================================

-- Report shares lookup (owner perspective)
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id) WHERE revoked_at IS NULL;

-- User's shared reports (recipient perspective)
CREATE INDEX idx_report_shares_shared_with ON report_shares(shared_with) WHERE revoked_at IS NULL;

-- User's shared reports (sharer perspective)
CREATE INDEX idx_report_shares_shared_by ON report_shares(shared_by) WHERE revoked_at IS NULL;

-- Share link validation (for anonymous access)
CREATE INDEX idx_report_shares_token ON report_shares(share_token)
  WHERE revoked_at IS NULL AND share_token IS NOT NULL;

-- Expired shares cleanup
CREATE INDEX idx_report_shares_expired ON report_shares(share_link_expires_at)
  WHERE revoked_at IS NULL AND share_link_expires_at IS NOT NULL;

-- ============================================================================
-- Triggers for social tables
-- ============================================================================

-- Function: Update favorite count in report_metadata
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE report_metadata
    SET favorite_count = favorite_count + 1
    WHERE report_id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE report_metadata
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE report_id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update favorite count
CREATE TRIGGER report_favorites_count
  AFTER INSERT OR DELETE ON report_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();

-- ============================================================================
-- Function: Generate secure share token
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate token if share_token is requested but not provided
  IF NEW.share_token IS NULL AND TG_OP = 'INSERT' THEN
    -- Generate random 32-character token
    NEW.share_token := encode(gen_random_bytes(24), 'base64');
    NEW.share_token := REPLACE(NEW.share_token, '/', '_');
    NEW.share_token := REPLACE(NEW.share_token, '+', '-');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger is optional - only enable if you want auto-generated tokens
-- CREATE TRIGGER report_shares_generate_token
--   BEFORE INSERT ON report_shares
--   FOR EACH ROW
--   EXECUTE FUNCTION generate_share_token();

-- ============================================================================
-- Function: Revoke share
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_share(p_share_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  UPDATE report_shares
  SET revoked_at = NOW()
  WHERE id = p_share_id AND revoked_at IS NULL;

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revoke_share IS 'Revoke a report share by ID, returns true if share was revoked';

-- ============================================================================
-- Function: Check user permission for report
-- ============================================================================

CREATE OR REPLACE FUNCTION check_report_permission(
  p_user_id VARCHAR,
  p_report_id UUID,
  p_required_permission VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_share_permission VARCHAR;
BEGIN
  -- Check if user is the owner
  SELECT EXISTS(
    SELECT 1 FROM reports
    WHERE id = p_report_id AND user_id = p_user_id AND deleted_at IS NULL
  ) INTO v_is_owner;

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check shared access
  SELECT permission_level INTO v_share_permission
  FROM report_shares
  WHERE
    report_id = p_report_id
    AND shared_with = p_user_id
    AND revoked_at IS NULL
    AND (share_link_expires_at IS NULL OR share_link_expires_at > NOW());

  -- Permission hierarchy: admin > edit > view
  IF v_share_permission IS NULL THEN
    RETURN FALSE;
  ELSIF v_share_permission = 'admin' THEN
    RETURN TRUE;
  ELSIF v_share_permission = 'edit' AND p_required_permission IN ('view', 'edit') THEN
    RETURN TRUE;
  ELSIF v_share_permission = 'view' AND p_required_permission = 'view' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_report_permission IS 'Check if user has required permission level for a report';

-- ============================================================================
-- Views for social features
-- ============================================================================

-- View: User favorites with report details
CREATE OR REPLACE VIEW v_user_favorites AS
SELECT
  f.user_id,
  f.report_id,
  f.sort_order,
  f.notes as favorite_notes,
  f.created_at as favorited_at,
  r.title,
  r.description,
  r.tags,
  r.category,
  r.updated_at as report_updated_at,
  rm.view_count,
  rm.export_count
FROM report_favorites f
JOIN reports r ON r.id = f.report_id
LEFT JOIN report_metadata rm ON rm.report_id = r.id
WHERE r.deleted_at IS NULL;

COMMENT ON VIEW v_user_favorites IS 'User favorites with enriched report information';

-- View: Active shares with report details
CREATE OR REPLACE VIEW v_active_shares AS
SELECT
  s.id as share_id,
  s.report_id,
  s.shared_by,
  s.shared_with,
  s.permission_level,
  s.share_token,
  s.share_link_expires_at,
  s.created_at as shared_at,
  r.title as report_title,
  r.user_id as report_owner
FROM report_shares s
JOIN reports r ON r.id = s.report_id
WHERE
  s.revoked_at IS NULL
  AND r.deleted_at IS NULL
  AND (s.share_link_expires_at IS NULL OR s.share_link_expires_at > NOW());

COMMENT ON VIEW v_active_shares IS 'Currently active shares with report information';

-- View: Popular reports (by favorite count)
CREATE OR REPLACE VIEW v_popular_reports AS
SELECT
  r.id,
  r.title,
  r.description,
  r.tags,
  r.category,
  r.created_at,
  rm.favorite_count,
  rm.view_count,
  rm.export_count
FROM reports r
JOIN report_metadata rm ON rm.report_id = r.id
WHERE r.deleted_at IS NULL AND rm.favorite_count > 0
ORDER BY rm.favorite_count DESC, rm.view_count DESC;

COMMENT ON VIEW v_popular_reports IS 'Reports ordered by popularity (favorites and views)';

-- ============================================================================
-- Sample Data (Optional - Comment out for production)
-- ============================================================================

-- Uncomment for development/testing
/*
-- Sample favorite
INSERT INTO report_favorites (user_id, report_id, notes)
SELECT
  'user_123',
  id,
  'Important quarterly report'
FROM reports
WHERE title LIKE '%Q4%'
LIMIT 1;

-- Sample share (view permission)
INSERT INTO report_shares (report_id, shared_by, shared_with, permission_level)
SELECT
  id,
  'user_123',
  'user_456',
  'view'
FROM reports
WHERE user_id = 'user_123'
LIMIT 1;

-- Sample share with link (expires in 7 days)
INSERT INTO report_shares (
  report_id,
  shared_by,
  shared_with,
  permission_level,
  share_token,
  share_link_expires_at
)
SELECT
  id,
  'user_123',
  'anonymous',
  'view',
  encode(gen_random_bytes(24), 'base64'),
  NOW() + INTERVAL '7 days'
FROM reports
WHERE user_id = 'user_123'
LIMIT 1;
*/

-- ============================================================================
-- Cleanup Job: Expire old shares
-- ============================================================================

-- Function to automatically revoke expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE report_shares
  SET revoked_at = NOW()
  WHERE
    revoked_at IS NULL
    AND share_link_expires_at IS NOT NULL
    AND share_link_expires_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_shares IS 'Revoke expired shares, returns count of revoked shares';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 003 completed successfully';
  RAISE NOTICE 'Tables created: report_favorites, report_shares';
  RAISE NOTICE 'Indexes created: 9 total';
  RAISE NOTICE 'Functions created: 4 total';
  RAISE NOTICE 'Views created: 3 total';
  RAISE NOTICE 'Triggers created: 1 total';
END $$;
