# Database Schema for Reports

**Version**: 1.0
**Last Updated**: 2026-01-07

## Overview

This document defines the database schema for persisting AI-generated reports with full version history, metadata, and scheduling capabilities. The schema supports PostgreSQL with JSONB for flexible report storage.

## Design Principles

- **Full Report Storage**: Complete Report JSON stored in JSONB for flexibility
- **Version History**: Track all report changes with timestamps and diffs
- **Soft Deletes**: Never permanently delete reports, use deleted_at flag
- **User Ownership**: Multi-tenant support with user-based permissions
- **Performance**: Indexes on commonly queried fields
- **Audit Trail**: Complete history of all operations

## Tables

### 1. reports

Primary table for storing active reports.

```sql
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

-- Indexes
CREATE INDEX idx_reports_user_id ON reports(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_created_at ON reports(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_tags ON reports USING GIN(tags);
CREATE INDEX idx_reports_category ON reports(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_content ON reports USING GIN(content);
CREATE INDEX idx_reports_organization_id ON reports(organization_id) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_reports_fts ON reports USING GIN(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(content::text, '')
  )
) WHERE deleted_at IS NULL;
```

**Fields Explained**:

- `id`: Unique identifier (UUID for distributed systems)
- `user_id`: Owner of the report (string to support various auth providers)
- `organization_id`: Optional organization for multi-tenant support
- `content`: Full Report JSON (JSONB allows flexible querying and indexing)
- `version`: Current version number (increments with each update)
- `is_latest_version`: Flag for quickly finding latest version
- `tags`: Array of tags for categorization (indexed with GIN)
- `deleted_at`: Soft delete timestamp (NULL = active)

### 2. report_versions

Complete version history for all report changes.

```sql
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
  change_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'restore', 'schedule'

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

-- Indexes
CREATE INDEX idx_report_versions_report_id ON report_versions(report_id, version DESC);
CREATE INDEX idx_report_versions_created_at ON report_versions(created_at DESC);
CREATE INDEX idx_report_versions_changed_by ON report_versions(changed_by);
```

**Fields Explained**:

- `report_id`: Links to parent report
- `version`: Version number (matches report.version at time of creation)
- `content`: Complete snapshot of report at this version
- `change_summary`: Human-readable description of changes
- `changed_by`: User who made the change
- `change_type`: Category of change for audit purposes
- `content_diff`: JSON patch format for efficient storage (optional optimization)

### 3. report_metadata

Extended metadata and analytics for reports.

```sql
CREATE TABLE report_metadata (
  -- Primary Key
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

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_report_metadata_favorite ON report_metadata(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_report_metadata_view_count ON report_metadata(view_count DESC);
CREATE INDEX idx_report_metadata_last_viewed ON report_metadata(last_viewed_at DESC);
```

**Fields Explained**:

- `view_count`: Number of times report has been viewed
- `export_count`: Number of times report has been exported (PDF, etc.)
- `is_favorite`: User favorite flag for quick access
- `generation_time_ms`: Time taken to generate report (for optimization tracking)
- `data_source_info`: Details about data sources used (JSONB for flexibility)
- `ai_model`: Which AI model generated this report
- `custom_fields`: Extensible field for future metadata

### 4. report_schedules

Scheduling configuration for automated report generation.

```sql
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
  report_config JSONB NOT NULL, -- Stores parameters for report generation

  -- Status
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status VARCHAR(50), -- 'success', 'failure', 'pending'
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
  )
);

-- Indexes
CREATE INDEX idx_report_schedules_user_id ON report_schedules(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at)
  WHERE is_enabled = true AND deleted_at IS NULL;
CREATE INDEX idx_report_schedules_report_id ON report_schedules(report_id) WHERE deleted_at IS NULL;
```

**Fields Explained**:

- `cron_expression`: Standard cron format (e.g., "0 9 * * 1" = every Monday at 9 AM)
- `timezone`: Timezone for cron execution
- `report_config`: Complete configuration for generating the report (data sources, filters, etc.)
- `next_run_at`: Pre-calculated next execution time for efficient querying
- `last_run_status`: Status of most recent execution
- `total_runs`: Total execution count for monitoring

### 5. report_favorites (Join Table)

User-specific favorites for multi-user support.

```sql
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

-- Indexes
CREATE INDEX idx_report_favorites_user_id ON report_favorites(user_id, created_at DESC);
CREATE INDEX idx_report_favorites_sort_order ON report_favorites(user_id, sort_order);
```

**Fields Explained**:

- `user_id` + `report_id`: Composite key for user-report relationship
- `sort_order`: Custom ordering for favorites list
- `notes`: User notes about why they favorited this report

### 6. report_shares (Optional - Future)

Sharing and permissions for reports.

```sql
CREATE TABLE report_shares (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  shared_by VARCHAR(255) NOT NULL,
  shared_with VARCHAR(255) NOT NULL,

  -- Permissions
  permission_level VARCHAR(20) NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'

  -- Share Link (optional)
  share_token VARCHAR(100) UNIQUE,
  share_link_expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT report_shares_permission_check CHECK (
    permission_level IN ('view', 'edit', 'admin')
  ),
  CONSTRAINT report_shares_self_share_check CHECK (shared_by != shared_with)
);

-- Indexes
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_report_shares_shared_with ON report_shares(shared_with) WHERE revoked_at IS NULL;
CREATE INDEX idx_report_shares_token ON report_shares(share_token) WHERE revoked_at IS NULL;
```

## Relationships

```mermaid
erDiagram
    REPORTS ||--o{ REPORT_VERSIONS : "has versions"
    REPORTS ||--o| REPORT_METADATA : "has metadata"
    REPORTS ||--o{ REPORT_SCHEDULES : "has schedules"
    REPORTS ||--o{ REPORT_FAVORITES : "favorited by users"
    REPORTS ||--o{ REPORT_SHARES : "shared with users"

    REPORTS {
        uuid id PK
        varchar user_id
        varchar title
        jsonb content
        integer version
        timestamp created_at
        timestamp deleted_at
    }

    REPORT_VERSIONS {
        uuid id PK
        uuid report_id FK
        integer version
        jsonb content
        varchar change_type
        timestamp created_at
    }

    REPORT_METADATA {
        uuid report_id PK_FK
        integer view_count
        integer export_count
        jsonb data_source_info
        timestamp last_viewed_at
    }

    REPORT_SCHEDULES {
        uuid id PK
        uuid report_id FK
        varchar cron_expression
        jsonb report_config
        boolean is_enabled
        timestamp next_run_at
    }

    REPORT_FAVORITES {
        varchar user_id PK
        uuid report_id PK_FK
        integer sort_order
        timestamp created_at
    }

    REPORT_SHARES {
        uuid id PK
        uuid report_id FK
        varchar shared_by
        varchar shared_with
        varchar permission_level
    }
```

## Query Examples

### 1. List User Reports (with pagination)

```sql
SELECT
  r.id,
  r.title,
  r.description,
  r.version,
  r.tags,
  r.category,
  r.created_at,
  r.updated_at,
  rm.view_count,
  rm.is_favorite,
  (SELECT COUNT(*) FROM report_versions rv WHERE rv.report_id = r.id) as version_count
FROM reports r
LEFT JOIN report_metadata rm ON rm.report_id = r.id
WHERE
  r.user_id = $1
  AND r.deleted_at IS NULL
ORDER BY r.updated_at DESC
LIMIT $2 OFFSET $3;
```

### 2. Get Report with Full Details

```sql
SELECT
  r.*,
  rm.*,
  (
    SELECT json_agg(
      json_build_object(
        'version', rv.version,
        'created_at', rv.created_at,
        'changed_by', rv.changed_by,
        'change_summary', rv.change_summary
      ) ORDER BY rv.version DESC
    )
    FROM report_versions rv
    WHERE rv.report_id = r.id
    LIMIT 10
  ) as recent_versions
FROM reports r
LEFT JOIN report_metadata rm ON rm.report_id = r.id
WHERE r.id = $1 AND r.deleted_at IS NULL;
```

### 3. Full-Text Search

```sql
SELECT
  r.id,
  r.title,
  r.description,
  ts_rank(
    to_tsvector('english',
      COALESCE(r.title, '') || ' ' ||
      COALESCE(r.description, '') || ' ' ||
      COALESCE(r.content::text, '')
    ),
    plainto_tsquery('english', $2)
  ) as relevance
FROM reports r
WHERE
  r.user_id = $1
  AND r.deleted_at IS NULL
  AND to_tsvector('english',
        COALESCE(r.title, '') || ' ' ||
        COALESCE(r.description, '') || ' ' ||
        COALESCE(r.content::text, '')
      ) @@ plainto_tsquery('english', $2)
ORDER BY relevance DESC
LIMIT 20;
```

### 4. Get Favorite Reports

```sql
SELECT
  r.*,
  rf.sort_order,
  rf.notes as favorite_notes
FROM report_favorites rf
JOIN reports r ON r.id = rf.report_id
WHERE
  rf.user_id = $1
  AND r.deleted_at IS NULL
ORDER BY COALESCE(rf.sort_order, 999999), rf.created_at DESC;
```

### 5. Get Scheduled Reports Due for Execution

```sql
SELECT
  rs.*,
  r.title,
  r.user_id
FROM report_schedules rs
LEFT JOIN reports r ON r.id = rs.report_id
WHERE
  rs.is_enabled = true
  AND rs.deleted_at IS NULL
  AND rs.next_run_at <= NOW()
ORDER BY rs.next_run_at ASC
LIMIT 100;
```

### 6. Filter Reports by Date Range and Tags

```sql
SELECT r.*
FROM reports r
WHERE
  r.user_id = $1
  AND r.deleted_at IS NULL
  AND r.created_at BETWEEN $2 AND $3
  AND r.tags && $4::text[] -- Array overlap operator
ORDER BY r.created_at DESC;
```

## Migration Strategy

### Phase 1: Core Tables (MVP)

1. Create `reports` table
2. Create `report_versions` table
3. Create `report_metadata` table
4. Create indexes

**Migration File**: `001_create_core_tables.sql`

### Phase 2: Scheduling

1. Create `report_schedules` table
2. Create indexes

**Migration File**: `002_create_scheduling_tables.sql`

### Phase 3: Social Features

1. Create `report_favorites` table
2. Create `report_shares` table
3. Create indexes

**Migration File**: `003_create_social_tables.sql`

### Phase 4: Performance Optimization

1. Add materialized views for popular queries
2. Add additional indexes based on query patterns
3. Partition large tables by date (if needed)

**Migration File**: `004_optimize_performance.sql`

## Performance Considerations

### JSONB Performance

- **Indexing**: GIN indexes on JSONB columns for fast queries
- **Partial Queries**: Use `->>` operator for direct field access
- **Size Limits**: Consider splitting very large reports (>10MB) into separate storage

### Versioning Strategy

- **Storage**: Full snapshots vs diffs
  - **Full snapshots**: Simpler, faster reads, more storage
  - **Diffs**: Complex, slower reads, less storage
  - **Recommendation**: Start with full snapshots, optimize later if needed

### Soft Deletes

- **Indexes**: All indexes include `WHERE deleted_at IS NULL` for performance
- **Cleanup**: Periodic job to hard-delete reports after retention period (e.g., 90 days)

### Pagination

- **Cursor-based**: For large datasets, use keyset pagination instead of OFFSET
- **Example**: `WHERE id > $last_id ORDER BY id LIMIT 20`

## Security Considerations

### Row-Level Security (RLS)

```sql
-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reports
CREATE POLICY reports_isolation_policy ON reports
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::varchar);

-- Policy: Allow shared reports
CREATE POLICY reports_shared_access_policy ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_shares
      WHERE report_shares.report_id = reports.id
        AND report_shares.shared_with = current_setting('app.current_user_id')::varchar
        AND report_shares.revoked_at IS NULL
    )
  );
```

### Data Encryption

- **At Rest**: Enable PostgreSQL encryption for sensitive columns
- **In Transit**: Use SSL/TLS for database connections
- **Application-Level**: Encrypt sensitive fields in `report_config` before storage

### Audit Logging

- **Trigger-Based**: Create triggers to log all DML operations
- **Change Data Capture**: Use PostgreSQL logical replication for audit trail
- **Retention**: Store audit logs in separate table with long retention

## Backup and Recovery

### Backup Strategy

- **Frequency**: Daily full backups, hourly incremental
- **Retention**: 30 days rolling backup, 1 year monthly archives
- **Testing**: Monthly restore testing

### Point-in-Time Recovery

- **Enable**: Configure PostgreSQL WAL archiving
- **RPO**: Recovery Point Objective = 15 minutes
- **RTO**: Recovery Time Objective = 1 hour

## Monitoring

### Key Metrics

- **Query Performance**: Slow query log for queries > 1s
- **Table Size**: Monitor reports table growth
- **Index Usage**: Track index hit rates
- **Replication Lag**: If using replication

### Alerts

- **Disk Space**: Alert when > 80% full
- **Connection Pool**: Alert when > 90% used
- **Failed Schedules**: Alert on consecutive failures
- **Query Timeouts**: Alert on timeout spike

## Future Enhancements

### Potential Additions

1. **report_comments**: Comments and annotations on reports
2. **report_approvals**: Approval workflow for reports
3. **report_exports**: Track all export operations
4. **report_templates**: Reusable report templates
5. **report_datasets**: Cache data sources for faster regeneration
6. **report_notifications**: User notification preferences

### Optimization Ideas

1. **Partitioning**: Partition by created_at for time-series data
2. **Materialized Views**: Pre-compute popular aggregations
3. **Read Replicas**: Separate read/write databases
4. **Caching Layer**: Redis for frequently accessed reports
5. **CDN**: Store exported PDFs in CDN for faster access

## References

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Cron Expression Format](https://crontab.guru/)
