'use client';

import { ErrorBoundary } from 'react-error-boundary';
import type { Report, Component } from '@/types/report-schema';
import { ChartComponent } from './ChartComponent';
import { KPIComponent } from './KPIComponent';
import { TableComponent } from './TableComponent';
import { MarkdownComponent } from './MarkdownComponent';
import { ImageComponent } from './ImageComponent';
import { GridCanvas } from './GridCanvas';

interface ReportCanvasProps {
  report: Report;
  editable?: boolean;
  showGrid?: boolean;
  onLayoutChange?: (components: Component[]) => void;
}

/**
 * ReportCanvas - Main container for rendering complete reports
 *
 * Features:
 * - Component factory pattern for type-safe rendering
 * - GridCanvas integration for drag-drop layout
 * - Error boundaries for graceful component failures
 * - Loading states for async operations
 * - Responsive design
 */
export function ReportCanvas({
  report,
  editable = false,
  showGrid = false,
  onLayoutChange,
}: ReportCanvasProps) {
  // Component factory - renders correct component based on type
  const renderComponent = (component: Component) => {
    try {
      switch (component.type) {
        case 'chart':
          return <ChartComponent component={component} />;
        case 'kpi':
          return <KPIComponent component={component} />;
        case 'table':
          return <TableComponent component={component} />;
        case 'markdown':
          return <MarkdownComponent component={component} />;
        case 'image':
          return <ImageComponent component={component} />;
        case 'mermaid':
          // Mermaid is handled separately in charts
          return (
            <div className="p-4 text-muted-foreground">
              Mermaid diagram component
            </div>
          );
        default:
          return (
            <div className="p-4 text-muted-foreground">
              Unknown component type: {(component as any).type}
            </div>
          );
      }
    } catch (error) {
      console.error(`Error rendering component ${component.id}:`, error);
      return (
        <div className="p-4 text-destructive">
          Error rendering component
        </div>
      );
    }
  };

  // Error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive mb-1">
            Component Error
          </h3>
          <p className="text-sm text-destructive/80 mb-3">
            {error.message || 'An error occurred while rendering this component'}
          </p>
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  // Handle layout changes from GridCanvas
  const handleLayoutChange = (layout: any[]) => {
    if (!onLayoutChange) return;

    const updatedComponents = report.components.map((component) => {
      const layoutItem = layout.find((item) => item.i === component.id);
      if (!layoutItem) return component;

      return {
        ...component,
        position: {
          ...component.position,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        },
      };
    });

    onLayoutChange(updatedComponents);
  };

  // Empty state
  if (!report.components || report.components.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-border">
        <div className="text-center max-w-md px-6">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Components
          </h3>
          <p className="text-sm text-muted-foreground">
            This report doesn't have any components to display.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Report Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {report.title}
        </h1>
        {report.description && (
          <p className="text-sm text-muted-foreground">
            {report.description}
          </p>
        )}
        {report.metadata?.tags && report.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {report.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid Canvas with Components */}
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <GridCanvas
          components={report.components}
          editable={editable}
          showGrid={showGrid}
          onLayoutChange={handleLayoutChange}
        >
          {report.components.map((component) => (
            <div
              key={component.id}
              className="w-full h-full overflow-hidden"
              data-component-id={component.id}
              data-component-type={component.type}
            >
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                resetKeys={[component.id]}
              >
                {renderComponent(component)}
              </ErrorBoundary>
            </div>
          ))}
        </GridCanvas>
      </ErrorBoundary>
    </div>
  );
}
