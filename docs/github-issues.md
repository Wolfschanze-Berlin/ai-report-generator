# GitHub Issues for AI Report Generator

Generated from brainstorm session: 2026-01-07

---

## M1: Foundation & Core Infrastructure

### Issue 1: Setup TypeScript types for Report JSON Schema
**Labels**: `typescript`, `enhancement`

**User Story**:
As a developer, I want TypeScript interfaces for the Report JSON Schema so that I have type-safe development and autocompletion.

**Description**:
Implement TypeScript types based on the Report JSON Schema defined in `docs/report-schema.md`.

**Acceptance Criteria**:
- [ ] Create `src/types/report-schema.ts` with all interfaces
- [ ] Types for: Report, Component, ChartComponent, KPIComponent, TableComponent, MarkdownComponent, MermaidComponent, ImageComponent
- [ ] Types for: LayoutConfig, ComponentPosition, ChartData, ChartDataset, ChartOptions
- [ ] Zod schemas for runtime validation
- [ ] Export all types from index file
- [ ] Add JSDoc documentation for each interface

**Technical Notes**:
- Use discriminated unions for Component types
- Consider using Zod for schema validation
- Ensure compatibility with Chart.js types (`chart.js`, `react-chartjs-2`)

---

### Issue 2: Implement Windmill API Client
**Labels**: `backend`, `api`, `windmill`

**User Story**:
As a system, I want to integrate with Windmill API to fetch raw data for report generation.

**Description**:
Create a Windmill API client that triggers jobs, polls for completion, and handles timeouts.

**Acceptance Criteria**:
- [ ] Create `src/lib/windmill-client.ts`
- [ ] Function: `triggerJob(query: OpenSearchQuery)` - returns job UUID
- [ ] Function: `waitForJobCompletion(uuid: string, timeout: number)` - polls with timeout
- [ ] 60-second timeout with graceful handling
- [ ] Error handling with detailed messages
- [ ] Environment variable validation (`WINDMILL_TOKEN`)
- [ ] TypeScript types for requests/responses
- [ ] Unit tests for client functions

**Technical Notes**:
- Endpoint: `https://analytics-playground.goldenproj.com/api/w/wm-fork-worlds-of-agents/jobs/run/p/f/mcp_tools/opeansearch_query_aggregration`
- Use polling interval: 1 second
- Handle timeout: return status "processing" after 60s
- Token from `.env`: `WINDMILL_TOKEN`

**API Reference**:
```typescript
interface WindmillClient {
  triggerJob(query: OpenSearchQuery): Promise<string>; // Returns UUID
  waitForJobCompletion(uuid: string, timeout?: number): Promise<WindmillResponse>;
}
```

---

### Issue 3: Create Windmill Server Action
**Labels**: `backend`, `server-action`

**User Story**:
As a frontend, I want a server action to fetch data from Windmill so that I can trigger report generation.

**Description**:
Create Next.js server action that validates input, calls Windmill client, and returns structured data.

**Acceptance Criteria**:
- [ ] Create `src/app/actions/fetch-windmill-data.ts`
- [ ] Accept structured OpenSearch query from AI clarification
- [ ] Call Windmill client with timeout handling
- [ ] Return raw database results or timeout status
- [ ] Detailed error messages passed to frontend
- [ ] Input validation using Zod
- [ ] Rate limiting considerations
- [ ] Logging for debugging

**Technical Notes**:
- Use `"use server"` directive
- Input: `{ query: { index, filters, aggregations } }`
- Output: `{ success: boolean, data?: any[], status?: string, message?: string, jobId: string }`

---

### Issue 4: Setup Data Gateway Foundation
**Labels**: `backend`, `data`, `infrastructure`

**User Story**:
As a user, I want to define custom data sources so that I can generate reports from my own data.

**Description**:
Create the foundational architecture for pluggable data sources beyond Windmill.

**Acceptance Criteria**:
- [ ] Design data source interface (`src/lib/data-gateway/types.ts`)
- [ ] Abstract data source base class
- [ ] Windmill data source implementation
- [ ] Data source registry/factory pattern
- [ ] Configuration schema for data sources
- [ ] Database schema for storing user data source configs
- [ ] API endpoints for CRUD operations on data sources
- [ ] Unit tests for gateway architecture

**Technical Notes**:
```typescript
interface DataSource {
  id: string;
  name: string;
  type: string; // 'windmill', 'postgres', 'mongodb', etc.
  connect(): Promise<void>;
  query(params: any): Promise<any[]>;
  disconnect(): Promise<void>;
}
```

---

### Issue 5: Create Project Documentation Structure
**Labels**: `documentation`

**User Story**:
As a developer, I want comprehensive documentation so that I understand the system architecture.

**Description**:
Set up documentation structure with architecture diagrams, API docs, and developer guides.

**Acceptance Criteria**:
- [ ] Create `docs/` directory structure
- [ ] `docs/architecture.md` - System architecture overview
- [ ] `docs/data-flow.md` - Data flow diagrams
- [ ] `docs/api-reference.md` - API documentation
- [ ] `docs/development-guide.md` - Local setup instructions
- [ ] `docs/deployment.md` - Deployment instructions
- [ ] Mermaid diagrams for architecture visualization
- [ ] README.md with quick start guide

---

## M2: Reporting Canvas & Visualization

### Issue 6: Implement Grid-Based Drag-Drop System
**Labels**: `frontend`, `chart`, `drag-drop`

**User Story**:
As a user, I want to rearrange report components on a grid so that I can customize my report layout.

**Description**:
Implement 12-column grid system with drag-drop functionality using react-grid-layout or similar.

**Acceptance Criteria**:
- [ ] Install and configure `react-grid-layout` (or alternative)
- [ ] Create `src/components/report-canvas/GridCanvas.tsx`
- [ ] 12-column responsive grid system
- [ ] Drag-drop component repositioning
- [ ] Resize components within grid
- [ ] Snap to grid behavior
- [ ] Touch support for mobile
- [ ] Grid visualization (show/hide grid lines)
- [ ] Undo/redo for layout changes
- [ ] Layout persistence (temporary - session only)

**Technical Notes**:
- Grid config: 12 columns, 80px row height, 16px gap
- Responsive breakpoints: lg (1200px), md (996px), sm (768px), xs (480px)
- Libraries to consider: `react-grid-layout`, `react-moveable`, `dnd-kit`

---

### Issue 7: Create Chart.js Component Wrapper
**Labels**: `frontend`, `chart`, `typescript`

**User Story**:
As a developer, I want reusable Chart.js components so that I can render all chart types from JSON.

**Description**:
Create a unified Chart component that renders any Chart.js chart type based on JSON schema.

**Acceptance Criteria**:
- [ ] Install `react-chartjs-2` and `chart.js`
- [ ] Create `src/components/report-canvas/ChartComponent.tsx`
- [ ] Support all Chart.js types: line, bar, pie, doughnut, polarArea, radar, scatter, bubble
- [ ] Support mixed charts (line + bar)
- [ ] Props accept `ChartComponent` type from schema
- [ ] Responsive chart sizing
- [ ] Theme support (light/dark mode)
- [ ] Chart.js plugin support
- [ ] Export chart as image (PNG/SVG)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Unit tests for each chart type

**Technical Notes**:
```typescript
interface ChartComponentProps {
  component: ChartComponent;
  theme?: 'light' | 'dark';
  onExport?: (image: Blob) => void;
}
```

---

### Issue 8: Implement KPI Card Component
**Labels**: `frontend`, `chart`

**User Story**:
As a user, I want to see key metrics displayed prominently so that I can quickly understand important numbers.

**Description**:
Create a KPI card component that displays large numbers with trends and comparisons.

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/KPIComponent.tsx`
- [ ] Display main value with unit
- [ ] Show percentage change with trend indicator (↑/↓)
- [ ] Change label (e.g., "vs last month")
- [ ] Color coding for positive/negative/neutral trends
- [ ] Optional icon support (lucide-react icons)
- [ ] Responsive sizing
- [ ] Animation on value change
- [ ] Tooltip for additional context
- [ ] Sparkline mini-chart (optional)
- [ ] Unit tests

**Design Notes**:
- Inspired by Material-UI Stats Card, Ant Design Statistic
- Use `lucide-react` for icons and trend indicators

---

### Issue 9: Create Data Table Component
**Labels**: `frontend`, `table`

**User Story**:
As a user, I want to view raw data in tables so that I can explore details beyond charts.

**Description**:
Implement data table with sorting, filtering, pagination, and export capabilities.

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/TableComponent.tsx`
- [ ] Column sorting (asc/desc, multi-column)
- [ ] Column filtering (text search, dropdowns)
- [ ] Pagination with configurable page size
- [ ] Row selection (optional)
- [ ] Responsive table (horizontal scroll on mobile)
- [ ] Export to CSV/Excel
- [ ] Column resizing
- [ ] Cell formatting (currency, date, number)
- [ ] Empty state handling
- [ ] Loading state
- [ ] Unit tests

**Technical Notes**:
- Consider libraries: `@tanstack/react-table`, `react-data-grid`, or custom implementation
- Use `xlsx` for Excel export

---

### Issue 10: Implement Markdown/Text Component
**Labels**: `frontend`, `markdown`

**User Story**:
As a user, I want to read insights and explanations in the report so that I understand the context.

**Description**:
Create a component that renders Markdown content with proper styling.

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/MarkdownComponent.tsx`
- [ ] Markdown parsing and rendering (use `react-markdown`)
- [ ] Support for: headings, lists, bold, italic, links, code blocks
- [ ] Syntax highlighting for code blocks (use `prism-react-renderer`)
- [ ] Custom styles matching design system
- [ ] Style variants: default, card, highlight
- [ ] XSS protection (sanitize HTML)
- [ ] Link handling (external links open in new tab)
- [ ] Unit tests

---

### Issue 11: Implement Mermaid Diagram Component
**Labels**: `frontend`, `chart`, `mermaid`

**User Story**:
As a user, I want to see process flows and diagrams in my reports so that I can visualize relationships.

**Description**:
Create a component that renders Mermaid diagrams (flowcharts, sequence diagrams, ERDs).

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/MermaidComponent.tsx`
- [ ] Install `mermaid` library
- [ ] Support all Mermaid diagram types
- [ ] Theme support (default, dark, forest, neutral)
- [ ] Responsive diagram sizing
- [ ] Error handling for invalid Mermaid syntax
- [ ] Export diagram as SVG/PNG
- [ ] Zoom and pan controls
- [ ] Accessibility improvements
- [ ] Unit tests

**Technical Notes**:
- Use `mermaid.initialize()` for configuration
- Render using `mermaid.render()` or React wrapper
- Consider security: sanitize user input

---

### Issue 12: Implement Image Component
**Labels**: `frontend`, `image`

**User Story**:
As a user, I want to include images in reports so that I can add visual context.

**Description**:
Create an image component that displays images with captions and different fit modes.

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/ImageComponent.tsx`
- [ ] Support URL and data URLs
- [ ] Fit modes: contain, cover, fill
- [ ] Optional caption display
- [ ] Alt text for accessibility
- [ ] Loading state (skeleton/spinner)
- [ ] Error state (broken image placeholder)
- [ ] Image optimization (Next.js Image component)
- [ ] Lazy loading
- [ ] Unit tests

---

### Issue 13: Create Report Canvas Container
**Labels**: `frontend`, `chart`

**User Story**:
As a user, I want to view complete reports in an interactive canvas so that I can explore my data.

**Description**:
Create the main canvas container that orchestrates all report components and grid layout.

**Acceptance Criteria**:
- [ ] Create `src/components/report-canvas/ReportCanvas.tsx`
- [ ] Accept Report JSON schema as props
- [ ] Render all component types based on type discriminator
- [ ] Integrate GridCanvas for drag-drop
- [ ] Component factory pattern for rendering
- [ ] Loading state while data fetches
- [ ] Error boundary for component failures
- [ ] Export full report as PDF/PNG
- [ ] Print stylesheet
- [ ] Responsive behavior
- [ ] Unit and integration tests

---

## M3: AI Agent System

### Issue 14: Design AI Agent Architecture
**Labels**: `ai-agent`, `infrastructure`

**User Story**:
As a system architect, I want a clear AI agent architecture so that we can build scalable autonomous agents.

**Description**:
Define the architecture for multi-agent system with orchestration, communication, and state management.

**Acceptance Criteria**:
- [ ] Document agent architecture in `docs/ai-agents.md`
- [ ] Define agent interfaces and base classes
- [ ] Design agent communication protocol
- [ ] State management strategy for agents
- [ ] Agent lifecycle management (spawn, run, terminate)
- [ ] Error handling and recovery strategies
- [ ] Monitoring and observability approach
- [ ] Mermaid diagrams showing agent interactions

**Technical Notes**:
```typescript
interface Agent {
  id: string;
  type: AgentType;
  initialize(): Promise<void>;
  execute(context: AgentContext): Promise<AgentResult>;
  cleanup(): Promise<void>;
}
```

---

### Issue 15: Implement Clarification Agent
**Labels**: `ai-agent`, `backend`

**User Story**:
As a system, I want a clarification agent to understand user intent so that I can generate accurate reports.

**Description**:
Create an AI agent that takes user prompts and produces structured OpenSearch queries.

**Acceptance Criteria**:
- [ ] Create `src/lib/agents/clarification-agent.ts`
- [ ] Accept user natural language prompt
- [ ] Use LLM (OpenAI/Anthropic) to parse intent
- [ ] Generate structured OpenSearch query object
- [ ] Handle ambiguous queries (ask clarifying questions)
- [ ] Validate generated query structure
- [ ] Logging and debugging
- [ ] Unit tests with mock LLM responses
- [ ] Integration tests

**Technical Notes**:
- Input: User prompt (string)
- Output: `{ query: { index, filters, aggregations } }`
- LLM prompt engineering for query generation
- Consider using function calling for structured output

---

### Issue 16: Implement Analysis Agent
**Labels**: `ai-agent`, `backend`

**User Story**:
As a system, I want an analysis agent to transform raw data into insights so that users get meaningful reports.

**Description**:
Create an AI agent that takes raw Windmill data and generates Chart.js-ready report JSON.

**Acceptance Criteria**:
- [ ] Create `src/lib/agents/analysis-agent.ts`
- [ ] Accept raw OpenSearch results
- [ ] Use LLM to analyze data patterns
- [ ] Generate complete Report JSON (schema-compliant)
- [ ] Create appropriate chart types for data
- [ ] Generate insights and markdown summaries
- [ ] Suggest optimal layout
- [ ] Handle data transformation errors
- [ ] Unit tests
- [ ] Integration tests with sample data

**Technical Notes**:
- Input: Raw data array from Windmill
- Output: Complete Report JSON matching schema
- LLM prompt should include schema structure
- Consider token limits for large datasets

---

### Issue 17: Implement Monitoring Agent
**Labels**: `ai-agent`, `backend`, `monitoring`

**User Story**:
As a system, I want a monitoring agent to watch data sources so that I can trigger reports automatically.

**Description**:
Create an agent that monitors data sources for anomalies and events that should trigger reports.

**Acceptance Criteria**:
- [ ] Create `src/lib/agents/monitoring-agent.ts`
- [ ] Periodic data source polling
- [ ] Anomaly detection algorithms (statistical methods)
- [ ] Event detection (thresholds, patterns)
- [ ] Trigger report generation on anomalies
- [ ] Configurable monitoring rules
- [ ] Alert logging
- [ ] Dashboard for monitoring status
- [ ] Unit tests
- [ ] Integration tests

**Technical Notes**:
- Anomaly detection: Z-score, IQR, time-series analysis
- Event types: threshold breaches, trend changes, pattern detection
- Store monitoring state in database

---

### Issue 18: Implement Optimization Agent
**Labels**: `ai-agent`, `backend`, `ml`

**User Story**:
As a system, I want an optimization agent to improve report quality so that reports get better over time.

**Description**:
Create an agent that learns from user interactions and improves report generation.

**Acceptance Criteria**:
- [ ] Create `src/lib/agents/optimization-agent.ts`
- [ ] Track user interactions (layout changes, component usage)
- [ ] Analyze report effectiveness metrics
- [ ] Learn user preferences over time
- [ ] Suggest layout improvements
- [ ] Optimize chart type selection
- [ ] A/B testing framework for report variations
- [ ] Feedback loop to analysis agent
- [ ] Unit tests

**Technical Notes**:
- Store interaction data: clicks, time spent, layout changes
- Metrics: engagement rate, export frequency, user satisfaction
- Consider using embeddings for preference learning

---

### Issue 19: Create Agent Orchestrator
**Labels**: `ai-agent`, `backend`, `infrastructure`

**User Story**:
As a system, I want an orchestrator to coordinate multiple agents so that they work together efficiently.

**Description**:
Create a central orchestrator that manages agent lifecycle, communication, and workflow.

**Acceptance Criteria**:
- [ ] Create `src/lib/agents/orchestrator.ts`
- [ ] Agent registration and discovery
- [ ] Workflow definition (agent execution order)
- [ ] Inter-agent communication protocol
- [ ] Parallel vs sequential execution
- [ ] Error handling and retries
- [ ] Agent health monitoring
- [ ] Resource management (rate limiting)
- [ ] Logging and observability
- [ ] Unit tests
- [ ] Integration tests

**Technical Notes**:
```typescript
interface Orchestrator {
  registerAgent(agent: Agent): void;
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
  getAgentStatus(agentId: string): AgentStatus;
}
```

---

## M4: Scheduling & Automation

### Issue 20: Implement Cron-Based Scheduling System
**Labels**: `backend`, `scheduling`, `infrastructure`

**User Story**:
As a user, I want to schedule reports to run automatically so that I get regular updates.

**Description**:
Create a cron-based scheduling system for periodic report generation.

**Acceptance Criteria**:
- [ ] Create `src/lib/scheduling/cron-scheduler.ts`
- [ ] Cron expression support (minute, hour, day, month, weekday)
- [ ] Store schedules in database
- [ ] Execute scheduled jobs reliably
- [ ] Job queue for execution (use Bull/BullMQ or similar)
- [ ] Retry failed jobs
- [ ] Job history and logs
- [ ] UI for creating/editing schedules
- [ ] Timezone support
- [ ] Pause/resume schedules
- [ ] Unit tests

**Technical Notes**:
- Use `node-cron` or `cron-parser` for expression parsing
- Consider using job queue: Bull, BullMQ, Agenda
- Store: schedule ID, cron expression, report config, user ID, enabled status

---

### Issue 21: Implement Event-Based Triggers
**Labels**: `backend`, `scheduling`, `events`

**User Story**:
As a user, I want reports to trigger on specific events so that I get timely insights.

**Description**:
Create an event system that triggers report generation based on defined conditions.

**Acceptance Criteria**:
- [ ] Create `src/lib/scheduling/event-triggers.ts`
- [ ] Define event types (webhook, data change, threshold breach)
- [ ] Event listener/handler architecture
- [ ] Webhook endpoint for external triggers
- [ ] Database change detection (polling or CDC)
- [ ] Trigger condition evaluation
- [ ] Trigger action execution (generate report)
- [ ] Event history and audit log
- [ ] UI for configuring triggers
- [ ] Unit tests

**Technical Notes**:
```typescript
interface EventTrigger {
  id: string;
  name: string;
  eventType: 'webhook' | 'data_change' | 'threshold';
  condition: TriggerCondition;
  action: TriggerAction;
  enabled: boolean;
}
```

---

### Issue 22: Implement Anomaly Detection for Auto-Triggering
**Labels**: `ai-agent`, `backend`, `ml`

**User Story**:
As a system, I want to detect data anomalies automatically so that I can alert users proactively.

**Description**:
Implement statistical anomaly detection that triggers report generation when anomalies are found.

**Acceptance Criteria**:
- [ ] Create `src/lib/scheduling/anomaly-detector.ts`
- [ ] Z-score anomaly detection
- [ ] IQR (Interquartile Range) method
- [ ] Time-series anomaly detection
- [ ] Configurable sensitivity thresholds
- [ ] Auto-trigger report generation on anomalies
- [ ] Anomaly severity classification (low, medium, high)
- [ ] Historical baseline calculation
- [ ] False positive handling
- [ ] Unit tests with synthetic data

**Technical Notes**:
- Methods: Z-score, modified Z-score, IQR, isolation forest
- Consider using libraries: `simple-statistics`, `ml.js`
- Store baselines per data source

---

### Issue 23: Create User-Defined Rules Engine
**Labels**: `backend`, `rules-engine`

**User Story**:
As a user, I want to define custom rules for report triggering so that I can automate my specific workflows.

**Description**:
Create a rules engine that allows users to define conditions and actions for automation.

**Acceptance Criteria**:
- [ ] Create `src/lib/scheduling/rules-engine.ts`
- [ ] Define rule syntax (JSON-based DSL)
- [ ] Condition evaluation engine
- [ ] Action execution engine
- [ ] Rule composition (AND, OR, NOT)
- [ ] Built-in functions (avg, sum, count, etc.)
- [ ] UI for visual rule builder
- [ ] Rule validation before saving
- [ ] Rule testing/preview
- [ ] Unit tests

**Technical Notes**:
```json
{
  "name": "High Sales Alert",
  "condition": {
    "operator": "AND",
    "conditions": [
      { "field": "sales", "operator": ">", "value": 10000 },
      { "field": "region", "operator": "=", "value": "APAC" }
    ]
  },
  "action": {
    "type": "generate_report",
    "reportType": "sales_analysis"
  }
}
```

---

### Issue 24: Create Autonomous Report Generation Pipeline
**Labels**: `ai-agent`, `backend`, `automation`

**User Story**:
As a system, I want to generate reports autonomously so that users receive insights without manual requests.

**Description**:
Integrate all agents, scheduling, and triggers into a complete autonomous pipeline.

**Acceptance Criteria**:
- [ ] Create `src/lib/autonomous/pipeline.ts`
- [ ] Integrate clarification, analysis, monitoring agents
- [ ] Integrate scheduling and event triggers
- [ ] End-to-end workflow: trigger → data fetch → analysis → report
- [ ] Error handling and recovery
- [ ] Report versioning and storage
- [ ] Notification system (in-app only)
- [ ] Pipeline status dashboard
- [ ] Logging and observability
- [ ] Integration tests

---

## M5: Data Gateway & Custom Sources

### Issue 25: Design Data Source Plugin Architecture
**Labels**: `backend`, `data`, `infrastructure`

**User Story**:
As a developer, I want a plugin architecture for data sources so that I can easily add new connectors.

**Description**:
Design and implement a pluggable architecture for custom data source integrations.

**Acceptance Criteria**:
- [ ] Document plugin architecture in `docs/data-gateway.md`
- [ ] Define `DataSourcePlugin` interface
- [ ] Plugin discovery and registration
- [ ] Plugin lifecycle management
- [ ] Plugin configuration schema
- [ ] Security considerations for plugins
- [ ] Example plugin implementation
- [ ] Plugin testing framework
- [ ] Developer guide for creating plugins

**Technical Notes**:
```typescript
interface DataSourcePlugin {
  id: string;
  name: string;
  version: string;
  initialize(config: PluginConfig): Promise<void>;
  query(params: QueryParams): Promise<QueryResult>;
  test(): Promise<TestResult>;
  cleanup(): Promise<void>;
}
```

---

### Issue 26: Implement PostgreSQL Data Source Plugin
**Labels**: `backend`, `data`, `postgresql`

**User Story**:
As a user, I want to connect to PostgreSQL databases so that I can generate reports from my data.

**Description**:
Create a PostgreSQL data source plugin.

**Acceptance Criteria**:
- [ ] Create `src/lib/data-gateway/plugins/postgresql.ts`
- [ ] Connection pooling
- [ ] SQL query execution
- [ ] Query result transformation to common format
- [ ] Connection validation
- [ ] Error handling
- [ ] Support for parameterized queries
- [ ] Transaction support
- [ ] Unit tests with mock database
- [ ] Integration tests with real PostgreSQL

---

### Issue 27: Implement MongoDB Data Source Plugin
**Labels**: `backend`, `data`, `mongodb`

**User Story**:
As a user, I want to connect to MongoDB databases so that I can generate reports from NoSQL data.

**Description**:
Create a MongoDB data source plugin.

**Acceptance Criteria**:
- [ ] Create `src/lib/data-gateway/plugins/mongodb.ts`
- [ ] MongoDB connection handling
- [ ] Query execution (MongoDB query syntax)
- [ ] Aggregation pipeline support
- [ ] Result transformation to common format
- [ ] Connection validation
- [ ] Error handling
- [ ] Unit tests
- [ ] Integration tests

---

### Issue 28: Implement REST API Data Source Plugin
**Labels**: `backend`, `data`, `api`

**User Story**:
As a user, I want to connect to REST APIs so that I can generate reports from external services.

**Description**:
Create a REST API data source plugin with authentication support.

**Acceptance Criteria**:
- [ ] Create `src/lib/data-gateway/plugins/rest-api.ts`
- [ ] HTTP request handling (GET, POST)
- [ ] Authentication methods: API key, Bearer token, Basic auth, OAuth2
- [ ] Request/response transformation
- [ ] Rate limiting and retries
- [ ] Error handling
- [ ] Pagination support
- [ ] Unit tests
- [ ] Integration tests

---

### Issue 29: Create Data Source Configuration UI
**Labels**: `frontend`, `data`

**User Story**:
As a user, I want to configure data sources through a UI so that I can connect my own data.

**Description**:
Create a UI for managing user data source connections.

**Acceptance Criteria**:
- [ ] Create data sources management page
- [ ] List all configured data sources
- [ ] Add new data source (form with plugin-specific fields)
- [ ] Edit existing data source
- [ ] Delete data source (with confirmation)
- [ ] Test connection functionality
- [ ] Secure credential storage (encrypted)
- [ ] Form validation
- [ ] Error handling and user feedback
- [ ] Unit tests

---

### Issue 30: Implement Multi-Source Query Aggregation
**Labels**: `backend`, `data`

**User Story**:
As a user, I want to combine data from multiple sources so that I can create comprehensive reports.

**Description**:
Implement logic to query multiple data sources and aggregate results.

**Acceptance Criteria**:
- [ ] Create `src/lib/data-gateway/aggregator.ts`
- [ ] Query multiple sources in parallel
- [ ] Result merging strategies (union, join, concat)
- [ ] Handle different data formats
- [ ] Error handling (partial failures)
- [ ] Performance optimization
- [ ] Caching layer
- [ ] Unit tests
- [ ] Integration tests

---

## M6: Report Management & History

### Issue 31: Design Database Schema for Reports
**Labels**: `backend`, `data`, `database`

**User Story**:
As a developer, I want a database schema for report storage so that we can persist and version reports.

**Description**:
Design and implement database schema for storing reports with full versioning.

**Acceptance Criteria**:
- [ ] Document schema in `docs/database-schema.md`
- [ ] Tables: `reports`, `report_versions`, `report_metadata`, `report_schedules`
- [ ] Full report JSON storage (JSONB column)
- [ ] Version history tracking
- [ ] User ownership and permissions
- [ ] Timestamps (created, updated, deleted)
- [ ] Soft delete support
- [ ] Database migration files
- [ ] Indexes for performance

**Schema Outline**:
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  latest_version_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE report_versions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  version INT,
  report_json JSONB,
  metadata JSONB,
  created_at TIMESTAMP
);
```

---

### Issue 32: Implement Report Storage Service
**Labels**: `backend`, `data`

**User Story**:
As a system, I want a service to manage report persistence so that reports are stored reliably.

**Description**:
Create a service layer for CRUD operations on reports.

**Acceptance Criteria**:
- [ ] Create `src/lib/reports/storage-service.ts`
- [ ] CRUD operations: create, read, update, delete (soft)
- [ ] Version management: create version, list versions, restore version
- [ ] Query operations: list reports, search, filter
- [ ] Pagination support
- [ ] Transaction handling
- [ ] Error handling
- [ ] Unit tests
- [ ] Integration tests with database

---

### Issue 33: Create Report Dashboard Page
**Labels**: `frontend`, `dashboard`

**User Story**:
As a user, I want a dashboard to view all my reports so that I can access them easily.

**Description**:
Create a dashboard UI for browsing and managing reports.

**Acceptance Criteria**:
- [ ] Create `src/app/dashboard/page.tsx`
- [ ] Grid/list view toggle
- [ ] Report cards with thumbnails (if possible)
- [ ] Sort by: date, name, type
- [ ] Filter by: date range, tags, data source
- [ ] Search functionality
- [ ] Pagination or infinite scroll
- [ ] Quick actions: view, edit, delete, duplicate
- [ ] Empty state for no reports
- [ ] Loading states
- [ ] Unit tests

---

### Issue 34: Implement Report Search and Filtering
**Labels**: `backend`, `search`

**User Story**:
As a user, I want to search and filter reports so that I can find specific reports quickly.

**Description**:
Implement full-text search and advanced filtering for reports.

**Acceptance Criteria**:
- [ ] Full-text search on title, description, content
- [ ] Filter by date range
- [ ] Filter by tags/categories
- [ ] Filter by data source
- [ ] Filter by author
- [ ] Combined filters (AND/OR logic)
- [ ] Search API endpoint
- [ ] Indexing for performance (PostgreSQL FTS or Elasticsearch)
- [ ] Unit tests

---

### Issue 35: Implement Report Versioning UI
**Labels**: `frontend`, `version-control`

**User Story**:
As a user, I want to view report version history so that I can track changes over time.

**Description**:
Create UI for viewing and managing report versions.

**Acceptance Criteria**:
- [ ] Version history page/modal
- [ ] List all versions with timestamps
- [ ] Visual diff between versions (optional)
- [ ] Restore previous version
- [ ] Delete specific version
- [ ] Version metadata display
- [ ] Loading states
- [ ] Unit tests

---

### Issue 36: Implement Report Favorites/Bookmarks
**Labels**: `frontend`, `backend`, `feature`

**User Story**:
As a user, I want to favorite reports so that I can access important reports quickly.

**Description**:
Add favorites/bookmarks functionality for reports.

**Acceptance Criteria**:
- [ ] Database schema for favorites (user_id, report_id, created_at)
- [ ] API endpoints: add favorite, remove favorite, list favorites
- [ ] UI: favorite button/icon in report cards
- [ ] Favorites section in dashboard
- [ ] Sort favorites by date added or custom order
- [ ] Unit tests
- [ ] Integration tests

---

### Issue 37: Implement Report Export to PDF
**Labels**: `frontend`, `backend`, `export`

**User Story**:
As a user, I want to export reports as PDF so that I can share them offline.

**Description**:
Implement PDF export functionality preserving layout and visuals.

**Acceptance Criteria**:
- [ ] Server-side PDF generation (use Puppeteer or similar)
- [ ] Preserve report layout and styling
- [ ] Include all charts, tables, and components
- [ ] Page breaks handled properly
- [ ] Custom PDF metadata (title, author, date)
- [ ] Download PDF from frontend
- [ ] Progress indicator during generation
- [ ] Error handling
- [ ] Unit tests

**Technical Notes**:
- Consider libraries: Puppeteer, Playwright, jsPDF, pdfmake
- Generate from HTML rendering of report

---

### Issue 38: Create Report Templates System
**Labels**: `frontend`, `backend`, `feature`

**User Story**:
As a user, I want to create reusable report templates so that I can standardize reporting.

**Description**:
Implement a templates system for reusable report configurations.

**Acceptance Criteria**:
- [ ] Database schema for templates
- [ ] Template CRUD operations
- [ ] Save report as template
- [ ] Create report from template
- [ ] Public/private templates
- [ ] Template categories
- [ ] Template preview
- [ ] Template library UI
- [ ] Unit tests

---

## Additional Future Features (Parking Lot)

### Issue 39: Real-Time Collaboration
**Labels**: `feature`, `collaboration`, `future`

Enable multiple users to collaborate on reports in real-time.

---

### Issue 40: Advanced Data Transformations
**Labels**: `feature`, `data`, `future`

Allow users to define custom data transformation pipelines.

---

### Issue 41: Mobile App
**Labels**: `feature`, `mobile`, `future`

Create a mobile app (React Native) for viewing reports on the go.

---

### Issue 42: Embedded Reports
**Labels**: `feature`, `embed`, `future`

Allow reports to be embedded in external websites via iframe.

---

### Issue 43: AI-Generated Insights Narration
**Labels**: `feature`, `ai-agent`, `future`

Generate natural language narration of insights (audio/video).

---

## Summary

**Total Issues**: 43
**Milestones**: 6

### Milestone Breakdown:
- **M1: Foundation** - 5 issues (core infrastructure, types, Windmill, data gateway)
- **M2: Canvas & Visualization** - 8 issues (grid, charts, tables, components)
- **M3: AI Agents** - 6 issues (agents architecture, orchestrator)
- **M4: Scheduling & Automation** - 5 issues (cron, events, anomaly detection, rules)
- **M5: Data Gateway** - 6 issues (plugin architecture, connectors, UI)
- **M6: Report Management** - 7 issues (storage, versioning, search, export)
- **Future** - 6 issues (parking lot for future enhancements)

---

**Next Steps**:
1. Review and prioritize issues
2. Assign issues to team members
3. Set milestone dates
4. Begin M1 development
