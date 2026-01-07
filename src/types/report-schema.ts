/**
 * AI Report Generator - TypeScript Type Definitions
 *
 * Complete type definitions for the Report JSON Schema.
 * Based on docs/report-schema.md (Version 1.0.0)
 *
 * @packageDocumentation
 */

import { z } from 'zod';

// ============================================================================
// Component Position & Layout
// ============================================================================

/**
 * Grid position for a component in the 12-column layout system.
 *
 * @property x - Grid column start position (0-11)
 * @property y - Grid row start position (0-infinity)
 * @property w - Width in grid columns (1-12)
 * @property h - Height in grid rows (1-infinity)
 * @property minW - Optional minimum width in columns
 * @property minH - Optional minimum height in rows
 */
export interface ComponentPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export const ComponentPositionSchema = z.object({
  x: z.number().min(0).max(11),
  y: z.number().min(0),
  w: z.number().min(1).max(12),
  h: z.number().min(1),
  minW: z.number().min(1).max(12).optional(),
  minH: z.number().min(1).optional(),
});

/**
 * Layout configuration for the report grid system.
 * Uses a 12-column responsive grid (similar to Bootstrap/Material-UI).
 *
 * @property columns - Always 12 columns
 * @property rowHeight - Height of one grid row in pixels (default: 80)
 * @property gap - Gap between components in pixels (default: 16)
 * @property responsive - Enable responsive breakpoints (default: true)
 */
export interface LayoutConfig {
  columns: 12;
  rowHeight: number;
  gap: number;
  responsive: boolean;
}

export const LayoutConfigSchema = z.object({
  columns: z.literal(12),
  rowHeight: z.number().positive().default(80),
  gap: z.number().min(0).default(16),
  responsive: z.boolean().default(true),
});

// ============================================================================
// Component Types
// ============================================================================

/**
 * All supported component types in the report system.
 */
export type ComponentType = 'chart' | 'kpi' | 'table' | 'markdown' | 'mermaid' | 'image';

export const ComponentTypeSchema = z.enum(['chart', 'kpi', 'table', 'markdown', 'mermaid', 'image']);

/**
 * Base interface for all report components.
 * Use discriminated union with 'type' field to differentiate component types.
 */
export interface BaseComponent {
  id: string;
  type: ComponentType;
  position: ComponentPosition;
  title?: string;
}

// ============================================================================
// Chart Component
// ============================================================================

/**
 * All Chart.js chart types supported by the system.
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble' | 'mixed';

export const ChartTypeSchema = z.enum([
  'line',
  'bar',
  'pie',
  'doughnut',
  'polarArea',
  'radar',
  'scatter',
  'bubble',
  'mixed',
]);

/**
 * Dataset for Chart.js charts.
 * Supports additional Chart.js properties via index signature.
 */
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  type?: ChartType; // For mixed charts
  [key: string]: any; // Additional Chart.js properties
}

export const ChartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderWidth: z.number().optional(),
  type: ChartTypeSchema.optional(),
}).passthrough(); // Allow additional properties

/**
 * Chart.js data object with labels and datasets.
 */
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(ChartDatasetSchema),
});

/**
 * Chart.js options object.
 * Supports all Chart.js configuration options.
 */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: any;
    tooltip?: any;
    title?: any;
  };
  scales?: any;
  [key: string]: any; // Additional Chart.js options
}

export const ChartOptionsSchema = z.object({
  responsive: z.boolean().optional(),
  maintainAspectRatio: z.boolean().optional(),
  plugins: z.object({
    legend: z.any().optional(),
    tooltip: z.any().optional(),
    title: z.any().optional(),
  }).optional(),
  scales: z.any().optional(),
}).passthrough();

/**
 * Chart component for rendering all Chart.js chart types.
 */
export interface ChartComponent extends BaseComponent {
  type: 'chart';
  data: {
    chartType: ChartType;
    chartData: ChartData;
    chartOptions?: ChartOptions;
  };
}

export const ChartComponentSchema = z.object({
  id: z.string(),
  type: z.literal('chart'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    chartType: ChartTypeSchema,
    chartData: ChartDataSchema,
    chartOptions: ChartOptionsSchema.optional(),
  }),
});

// ============================================================================
// KPI Component
// ============================================================================

/**
 * Trend direction for KPI metrics.
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

export const TrendDirectionSchema = z.enum(['up', 'down', 'neutral']);

/**
 * KPI (Key Performance Indicator) component for displaying big numbers with trends.
 */
export interface KPIComponent extends BaseComponent {
  type: 'kpi';
  data: {
    value: number | string;
    label: string;
    unit?: string;
    change?: number;
    changeLabel?: string;
    trend?: TrendDirection;
    color?: string;
    icon?: string;
  };
}

export const KPIComponentSchema = z.object({
  id: z.string(),
  type: z.literal('kpi'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    value: z.union([z.number(), z.string()]),
    label: z.string(),
    unit: z.string().optional(),
    change: z.number().optional(),
    changeLabel: z.string().optional(),
    trend: TrendDirectionSchema.optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
});

// ============================================================================
// Table Component
// ============================================================================

/**
 * Column type for table formatting.
 */
export type TableColumnType = 'string' | 'number' | 'date' | 'currency';

export const TableColumnTypeSchema = z.enum(['string', 'number', 'date', 'currency']);

/**
 * Alignment options for table columns.
 */
export type TableColumnAlign = 'left' | 'center' | 'right';

export const TableColumnAlignSchema = z.enum(['left', 'center', 'right']);

/**
 * Table column configuration.
 */
export interface TableColumn {
  key: string;
  label: string;
  type?: TableColumnType;
  align?: TableColumnAlign;
  sortable?: boolean;
  width?: string;
}

export const TableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: TableColumnTypeSchema.optional(),
  align: TableColumnAlignSchema.optional(),
  sortable: z.boolean().optional(),
  width: z.string().optional(),
});

/**
 * Table row data (dynamic key-value pairs).
 */
export interface TableRow {
  [key: string]: any;
}

export const TableRowSchema = z.record(z.string(), z.any());

/**
 * Table component for displaying tabular data with sorting and filtering.
 */
export interface TableComponent extends BaseComponent {
  type: 'table';
  data: {
    columns: TableColumn[];
    rows: TableRow[];
    sortable?: boolean;
    filterable?: boolean;
    pagination?: boolean;
    pageSize?: number;
  };
}

export const TableComponentSchema = z.object({
  id: z.string(),
  type: z.literal('table'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    columns: z.array(TableColumnSchema),
    rows: z.array(TableRowSchema),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    pagination: z.boolean().optional(),
    pageSize: z.number().positive().optional(),
  }),
});

// ============================================================================
// Markdown Component
// ============================================================================

/**
 * Markdown style variants.
 */
export type MarkdownStyle = 'default' | 'card' | 'highlight';

export const MarkdownStyleSchema = z.enum(['default', 'card', 'highlight']);

/**
 * Markdown component for rich text content with Markdown support.
 */
export interface MarkdownComponent extends BaseComponent {
  type: 'markdown';
  data: {
    content: string;
    style?: MarkdownStyle;
  };
}

export const MarkdownComponentSchema = z.object({
  id: z.string(),
  type: z.literal('markdown'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    content: z.string(),
    style: MarkdownStyleSchema.optional(),
  }),
});

// ============================================================================
// Mermaid Component
// ============================================================================

/**
 * Mermaid diagram theme options.
 */
export type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral';

export const MermaidThemeSchema = z.enum(['default', 'dark', 'forest', 'neutral']);

/**
 * Mermaid component for flowcharts, sequence diagrams, and ERDs.
 */
export interface MermaidComponent extends BaseComponent {
  type: 'mermaid';
  data: {
    diagram: string;
    theme?: MermaidTheme;
  };
}

export const MermaidComponentSchema = z.object({
  id: z.string(),
  type: z.literal('mermaid'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    diagram: z.string(),
    theme: MermaidThemeSchema.optional(),
  }),
});

// ============================================================================
// Image Component
// ============================================================================

/**
 * Image fit modes.
 */
export type ImageFit = 'contain' | 'cover' | 'fill';

export const ImageFitSchema = z.enum(['contain', 'cover', 'fill']);

/**
 * Image component for displaying images with captions.
 */
export interface ImageComponent extends BaseComponent {
  type: 'image';
  data: {
    src: string;
    alt?: string;
    fit?: ImageFit;
    caption?: string;
  };
}

export const ImageComponentSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  position: ComponentPositionSchema,
  title: z.string().optional(),
  data: z.object({
    src: z.string().url(),
    alt: z.string().optional(),
    fit: ImageFitSchema.optional(),
    caption: z.string().optional(),
  }),
});

// ============================================================================
// Component Union (Discriminated Union)
// ============================================================================

/**
 * Union of all component types.
 * Use type narrowing with the 'type' discriminator.
 */
export type Component =
  | ChartComponent
  | KPIComponent
  | TableComponent
  | MarkdownComponent
  | MermaidComponent
  | ImageComponent;

export const ComponentSchema = z.union([
  ChartComponentSchema,
  KPIComponentSchema,
  TableComponentSchema,
  MarkdownComponentSchema,
  MermaidComponentSchema,
  ImageComponentSchema,
]);

// ============================================================================
// Report Metadata
// ============================================================================

/**
 * Optional metadata for reports.
 */
export interface ReportMetadata {
  author?: string;
  tags?: string[];
  dataSource?: string;
  queryParams?: any;
  executionTime?: number;
  version?: string;
}

export const ReportMetadataSchema = z.object({
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dataSource: z.string().optional(),
  queryParams: z.any().optional(),
  executionTime: z.number().optional(),
  version: z.string().optional(),
});

// ============================================================================
// Report Root Schema
// ============================================================================

/**
 * Complete report structure with all components and metadata.
 *
 * @property version - Schema version (e.g., "1.0.0")
 * @property id - Unique report ID
 * @property title - Report title
 * @property description - Optional report description
 * @property generatedAt - ISO timestamp when report was generated
 * @property layout - Grid layout configuration
 * @property components - Array of report components
 * @property metadata - Optional report metadata
 */
export interface Report {
  version: string;
  id: string;
  title: string;
  description?: string;
  generatedAt: string;
  layout: LayoutConfig;
  components: Component[];
  metadata?: ReportMetadata;
}

export const ReportSchema = z.object({
  version: z.string(),
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  generatedAt: z.string().datetime(),
  layout: LayoutConfigSchema,
  components: z.array(ComponentSchema),
  metadata: ReportMetadataSchema.optional(),
});

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a component is a ChartComponent.
 */
export function isChartComponent(component: Component): component is ChartComponent {
  return component.type === 'chart';
}

/**
 * Type guard to check if a component is a KPIComponent.
 */
export function isKPIComponent(component: Component): component is KPIComponent {
  return component.type === 'kpi';
}

/**
 * Type guard to check if a component is a TableComponent.
 */
export function isTableComponent(component: Component): component is TableComponent {
  return component.type === 'table';
}

/**
 * Type guard to check if a component is a MarkdownComponent.
 */
export function isMarkdownComponent(component: Component): component is MarkdownComponent {
  return component.type === 'markdown';
}

/**
 * Type guard to check if a component is a MermaidComponent.
 */
export function isMermaidComponent(component: Component): component is MermaidComponent {
  return component.type === 'mermaid';
}

/**
 * Type guard to check if a component is an ImageComponent.
 */
export function isImageComponent(component: Component): component is ImageComponent {
  return component.type === 'image';
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a report object against the schema.
 * @param data - The data to validate
 * @returns Parsed and validated Report object
 * @throws ZodError if validation fails
 */
export function validateReport(data: unknown): Report {
  return ReportSchema.parse(data) as Report;
}

/**
 * Safely validate a report object, returning success/error result.
 * @param data - The data to validate
 * @returns SafeParseReturnType with success flag and data or error
 */
export function safeValidateReport(data: unknown) {
  return ReportSchema.safeParse(data);
}

/**
 * Validate a component object against the schema.
 * @param data - The data to validate
 * @returns Parsed and validated Component object
 * @throws ZodError if validation fails
 */
export function validateComponent(data: unknown): Component {
  return ComponentSchema.parse(data) as Component;
}

/**
 * Safely validate a component object, returning success/error result.
 * @param data - The data to validate
 * @returns SafeParseReturnType with success flag and data or error
 */
export function safeValidateComponent(data: unknown) {
  return ComponentSchema.safeParse(data);
}
