# Database Migrations

This directory contains PostgreSQL database migrations for the AI Report Generator.

## Migration Files

Migrations are numbered sequentially and must be run in order:

1. **001_create_core_tables.sql** - Core report storage with versioning
   - `reports` table (main report storage)
   - `report_versions` table (version history)
   - `report_metadata` table (analytics and metadata)
   - Automatic versioning triggers
   - Full-text search indexes

2. **002_create_scheduling_tables.sql** - Automated report scheduling
   - `report_schedules` table (cron-based scheduling)
   - Schedule execution tracking
   - Monitoring views

3. **003_create_social_tables.sql** - Social features
   - `report_favorites` table (user favorites)
   - `report_shares` table (sharing with permissions)
   - Permission checking functions

## Running Migrations

### Using psql (PostgreSQL CLI)

```bash
# Run all migrations in order
psql -U postgres -d ai_report_generator -f migrations/001_create_core_tables.sql
psql -U postgres -d ai_report_generator -f migrations/002_create_scheduling_tables.sql
psql -U postgres -d ai_report_generator -f migrations/003_create_social_tables.sql
```

### Using Node.js Migration Tool

```bash
# Install migration tool (if not already installed)
npm install --save-dev node-pg-migrate

# Run migrations
npm run migrate up

# Rollback last migration
npm run migrate down
```

### Using Prisma (Alternative)

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma schema from database
npx prisma db pull

# Apply migrations
npx prisma migrate deploy
```

## Database Setup

### Local Development

```bash
# Create database
createdb ai_report_generator

# Or using psql
psql -U postgres
CREATE DATABASE ai_report_generator;
```

### Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run --name ai-report-postgres \
  -e POSTGRES_DB=ai_report_generator \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16

# Run migrations
docker exec -i ai-report-postgres psql -U postgres -d ai_report_generator < migrations/001_create_core_tables.sql
```

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_report_generator
```

## Schema Documentation

See [docs/database-schema.md](../docs/database-schema.md) for complete schema documentation including:
- Table structure and relationships
- Index strategy
- Query examples
- Performance considerations
- Security guidelines

## Migration Best Practices

1. **Never modify existing migrations** - Always create new ones
2. **Test locally first** - Run migrations on local database before production
3. **Backup before migration** - Always backup production database
4. **Run during low traffic** - Schedule migrations during maintenance windows
5. **Monitor performance** - Check query performance after schema changes

## Troubleshooting

### Migration fails with "relation already exists"

```sql
-- Drop and recreate (CAUTION: data loss)
DROP TABLE IF EXISTS reports CASCADE;
```

### Check if migration ran successfully

```sql
-- Check table existence
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Check functions
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

### Performance issues after migration

```sql
-- Analyze tables for query planner
ANALYZE reports;
ANALYZE report_versions;
ANALYZE report_metadata;

-- Vacuum to reclaim space
VACUUM FULL;
```

## Future Migrations

Additional migrations to consider:

- **004_optimize_performance.sql** - Partitioning, materialized views
- **005_add_comments_table.sql** - Comments and annotations
- **006_add_approvals_workflow.sql** - Report approval workflow
- **007_add_export_tracking.sql** - Track PDF exports
- **008_add_templates.sql** - Reusable report templates
