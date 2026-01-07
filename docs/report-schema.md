# AI Report Generator - JSON Schema Specification

## Overview

This schema defines the structure for AI-generated reports that render on a drag-drop grid canvas. The AI agent returns this JSON structure, which the frontend parser interprets to render Chart.js charts, Mermaid diagrams, tables, and other components.

## Schema Version

**Version**: 1.0.0
**Last Updated**: 2026-01-07

---

## Root Schema

```typescript
interface Report {
  version: string;              // Schema version (e.g., "1.0.0")
  id: string;                   // Unique report ID
  title: string;                // Report title
  description?: string;         // Optional report description
  generatedAt: string;          // ISO timestamp
  layout: LayoutConfig;         // Grid layout configuration
  components: Component[];      // Array of report components
  metadata?: ReportMetadata;    // Optional metadata
}
```

---

## Layout Configuration

Grid-based layout system with 12-column responsive grid (similar to Bootstrap/Material-UI).

```typescript
interface LayoutConfig {
  columns: 12;                  // Always 12-column grid
  rowHeight: number;            // Height of one grid row in pixels (default: 80)
  gap: number;                  // Gap between components in pixels (default: 16)
  responsive: boolean;          // Enable responsive breakpoints (default: true)
}

interface ComponentPosition {
  x: number;                    // Grid column start (0-11)
  y: number;                    // Grid row start (0-infinity)
  w: number;                    // Width in grid columns (1-12)
  h: number;                    // Height in grid rows (1-infinity)
  minW?: number;                // Minimum width in columns (optional)
  minH?: number;                // Minimum height in rows (optional)
}
```

**Example Layout:**
```json
{
  "columns": 12,
  "rowHeight": 80,
  "gap": 16,
  "responsive": true
}
```

---

## Component Types

### Base Component Interface

```typescript
interface Component {
  id: string;                   // Unique component ID
  type: ComponentType;          // Component type (see below)
  position: ComponentPosition;  // Grid position
  title?: string;               // Optional component title
  data: any;                    // Type-specific data
}

type ComponentType =
  | "chart"
  | "kpi"
  | "table"
  | "markdown"
  | "mermaid"
  | "image";
```

---

## 1. Chart Component

Supports all Chart.js chart types.

```typescript
interface ChartComponent extends Component {
  type: "chart";
  data: {
    chartType: ChartType;       // Chart.js chart type
    chartData: ChartData;       // Chart.js data object
    chartOptions?: ChartOptions; // Chart.js options (optional)
  };
}

type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "polarArea"
  | "radar"
  | "scatter"
  | "bubble"
  | "mixed";                    // For combined charts

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  type?: ChartType;             // For mixed charts
  [key: string]: any;           // Additional Chart.js properties
}

interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: any;
    tooltip?: any;
    title?: any;
  };
  scales?: any;
  [key: string]: any;           // Additional Chart.js options
}
```

**Example: Line Chart**
```json
{
  "id": "chart-1",
  "type": "chart",
  "title": "Sales Trend Q1 2024",
  "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
  "data": {
    "chartType": "line",
    "chartData": {
      "labels": ["Jan", "Feb", "Mar"],
      "datasets": [{
        "label": "Sales",
        "data": [15000, 18000, 22000],
        "borderColor": "rgb(75, 192, 192)",
        "tension": 0.1
      }]
    },
    "chartOptions": {
      "responsive": true,
      "plugins": {
        "legend": { "display": true }
      }
    }
  }
}
```

**Example: Mixed Chart (Line + Bar)**
```json
{
  "id": "chart-2",
  "type": "chart",
  "title": "Revenue vs Target",
  "position": { "x": 6, "y": 0, "w": 6, "h": 4 },
  "data": {
    "chartType": "mixed",
    "chartData": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [
        {
          "type": "line",
          "label": "Revenue",
          "data": [50000, 65000, 70000, 80000],
          "borderColor": "rgb(75, 192, 192)"
        },
        {
          "type": "bar",
          "label": "Target",
          "data": [60000, 60000, 75000, 75000],
          "backgroundColor": "rgba(255, 99, 132, 0.5)"
        }
      ]
    }
  }
}
```

---

## 2. KPI Component

Big number displays for key metrics.

```typescript
interface KPIComponent extends Component {
  type: "kpi";
  data: {
    value: number | string;     // Main metric value
    label: string;              // Metric label
    unit?: string;              // Unit (e.g., "$", "%", "users")
    change?: number;            // Percentage change (e.g., 15.5 for +15.5%)
    changeLabel?: string;       // Change period (e.g., "vs last month")
    trend?: "up" | "down" | "neutral"; // Trend indicator
    color?: string;             // Custom color
    icon?: string;              // Optional icon name
  };
}
```

**Example:**
```json
{
  "id": "kpi-1",
  "type": "kpi",
  "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
  "data": {
    "value": 145230,
    "label": "Total Revenue",
    "unit": "$",
    "change": 15.5,
    "changeLabel": "vs last month",
    "trend": "up",
    "color": "#10b981"
  }
}
```

---

## 3. Data Table Component

Tabular data with sorting and filtering capabilities.

```typescript
interface TableComponent extends Component {
  type: "table";
  data: {
    columns: TableColumn[];
    rows: TableRow[];
    sortable?: boolean;         // Enable column sorting (default: true)
    filterable?: boolean;       // Enable filtering (default: true)
    pagination?: boolean;       // Enable pagination (default: true)
    pageSize?: number;          // Rows per page (default: 10)
  };
}

interface TableColumn {
  key: string;                  // Column key
  label: string;                // Display label
  type?: "string" | "number" | "date" | "currency";
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;               // CSS width (e.g., "150px", "20%")
}

interface TableRow {
  [key: string]: any;           // Column values
}
```

**Example:**
```json
{
  "id": "table-1",
  "type": "table",
  "title": "Top Products",
  "position": { "x": 0, "y": 4, "w": 12, "h": 4 },
  "data": {
    "columns": [
      { "key": "product", "label": "Product", "type": "string" },
      { "key": "sales", "label": "Sales", "type": "currency", "align": "right" },
      { "key": "growth", "label": "Growth", "type": "number", "align": "right" }
    ],
    "rows": [
      { "product": "Widget A", "sales": 45000, "growth": 15.5 },
      { "product": "Widget B", "sales": 32000, "growth": -5.2 }
    ],
    "sortable": true,
    "pagination": true,
    "pageSize": 10
  }
}
```

---

## 4. Markdown/Text Component

Rich text content with Markdown support.

```typescript
interface MarkdownComponent extends Component {
  type: "markdown";
  data: {
    content: string;            // Markdown content
    style?: "default" | "card" | "highlight";
  };
}
```

**Example:**
```json
{
  "id": "text-1",
  "type": "markdown",
  "position": { "x": 0, "y": 8, "w": 12, "h": 2 },
  "data": {
    "content": "## Key Insights\\n\\n- Sales increased by **15.5%** compared to last month\\n- APAC region shows strongest growth\\n- Q4 target exceeded by 8%",
    "style": "card"
  }
}
```

---

## 5. Mermaid Diagram Component

Flowcharts, sequence diagrams, ERDs, etc.

```typescript
interface MermaidComponent extends Component {
  type: "mermaid";
  data: {
    diagram: string;            // Mermaid syntax
    theme?: "default" | "dark" | "forest" | "neutral";
  };
}
```

**Example:**
```json
{
  "id": "mermaid-1",
  "type": "mermaid",
  "title": "Sales Process Flow",
  "position": { "x": 0, "y": 10, "w": 6, "h": 4 },
  "data": {
    "diagram": "graph TD\n    A[Lead Generation] --> B[Qualification]\n    B --> C[Proposal]\n    C --> D[Negotiation]\n    D --> E[Closed Won]",
    "theme": "default"
  }
}
```

---

## 6. Image Component

Display images (logos, screenshots, external images).

```typescript
interface ImageComponent extends Component {
  type: "image";
  data: {
    src: string;                // Image URL or data URL
    alt?: string;               // Alt text
    fit?: "contain" | "cover" | "fill";
    caption?: string;           // Optional caption
  };
}
```

**Example:**
```json
{
  "id": "image-1",
  "type": "image",
  "title": "Product Mockup",
  "position": { "x": 6, "y": 10, "w": 6, "h": 4 },
  "data": {
    "src": "https://example.com/image.png",
    "alt": "Product mockup",
    "fit": "contain",
    "caption": "New product design concept"
  }
}
```

---

## Report Metadata

Optional metadata for analytics and context.

```typescript
interface ReportMetadata {
  author?: string;              // AI agent or user
  tags?: string[];              // Report categories/tags
  dataSource?: string;          // Data source (e.g., "Windmill OpenSearch")
  queryParams?: any;            // Original query parameters
  executionTime?: number;       // Generation time in ms
  version?: string;             // Report version
}
```

---

## Complete Example Report

```json
{
  "version": "1.0.0",
  "id": "report-2024-q1-sales",
  "title": "Q1 2024 Sales Performance Analysis",
  "description": "Comprehensive analysis of Q1 sales data across all regions",
  "generatedAt": "2024-04-01T10:30:00Z",
  "layout": {
    "columns": 12,
    "rowHeight": 80,
    "gap": 16,
    "responsive": true
  },
  "components": [
    {
      "id": "kpi-1",
      "type": "kpi",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 },
      "data": {
        "value": 145230,
        "label": "Total Revenue",
        "unit": "$",
        "change": 15.5,
        "changeLabel": "vs Q4 2023",
        "trend": "up"
      }
    },
    {
      "id": "kpi-2",
      "type": "kpi",
      "position": { "x": 3, "y": 0, "w": 3, "h": 2 },
      "data": {
        "value": 1247,
        "label": "New Customers",
        "change": 8.2,
        "changeLabel": "vs Q4 2023",
        "trend": "up"
      }
    },
    {
      "id": "chart-1",
      "type": "chart",
      "title": "Monthly Revenue Trend",
      "position": { "x": 0, "y": 2, "w": 6, "h": 4 },
      "data": {
        "chartType": "line",
        "chartData": {
          "labels": ["Jan", "Feb", "Mar"],
          "datasets": [{
            "label": "Revenue",
            "data": [45000, 48000, 52230],
            "borderColor": "rgb(75, 192, 192)",
            "tension": 0.1
          }]
        }
      }
    },
    {
      "id": "chart-2",
      "type": "chart",
      "title": "Revenue by Region",
      "position": { "x": 6, "y": 2, "w": 6, "h": 4 },
      "data": {
        "chartType": "pie",
        "chartData": {
          "labels": ["APAC", "EMEA", "Americas"],
          "datasets": [{
            "data": [52230, 45000, 48000],
            "backgroundColor": [
              "rgb(255, 99, 132)",
              "rgb(54, 162, 235)",
              "rgb(255, 205, 86)"
            ]
          }]
        }
      }
    },
    {
      "id": "table-1",
      "type": "table",
      "title": "Top 5 Products",
      "position": { "x": 0, "y": 6, "w": 12, "h": 4 },
      "data": {
        "columns": [
          { "key": "product", "label": "Product", "type": "string" },
          { "key": "revenue", "label": "Revenue", "type": "currency" },
          { "key": "units", "label": "Units Sold", "type": "number" },
          { "key": "growth", "label": "Growth %", "type": "number" }
        ],
        "rows": [
          { "product": "Widget Pro", "revenue": 35000, "units": 450, "growth": 25.5 },
          { "product": "Widget Plus", "revenue": 28000, "units": 380, "growth": 18.2 },
          { "product": "Widget Basic", "revenue": 22000, "units": 520, "growth": -5.1 }
        ],
        "sortable": true,
        "pagination": false
      }
    },
    {
      "id": "text-1",
      "type": "markdown",
      "position": { "x": 0, "y": 10, "w": 6, "h": 3 },
      "data": {
        "content": "## Key Insights\n\n- **Strong Quarter**: Revenue up 15.5% vs Q4 2023\n- **Regional Growth**: APAC leads with 36% of total revenue\n- **Product Performance**: Widget Pro drives growth with 25.5% increase\n- **Customer Acquisition**: 1,247 new customers added\n\n### Recommendations\n- Increase APAC marketing budget\n- Focus on Widget Pro upselling\n- Investigate Widget Basic decline",
        "style": "card"
      }
    },
    {
      "id": "mermaid-1",
      "type": "mermaid",
      "title": "Sales Funnel",
      "position": { "x": 6, "y": 10, "w": 6, "h": 3 },
      "data": {
        "diagram": "graph TD\n    A[Leads: 5000] --> B[Qualified: 2500]\n    B --> C[Proposals: 1500]\n    C --> D[Negotiations: 800]\n    D --> E[Closed Won: 450]",
        "theme": "default"
      }
    }
  ],
  "metadata": {
    "author": "AI Report Generator",
    "tags": ["sales", "q1-2024", "performance"],
    "dataSource": "Windmill OpenSearch",
    "executionTime": 2340
  }
}
```

---

## Schema Validation

TypeScript types should be generated from this schema. Consider using:
- Zod for runtime validation
- JSON Schema for documentation
- TypeScript interfaces for compile-time safety

---

## Extension Points

Future schema versions may support:
- Custom component types via plugin system
- Interactive filters that update multiple components
- Real-time data streaming
- Export to PDF/PNG with layout preservation
- Collaborative editing and comments
