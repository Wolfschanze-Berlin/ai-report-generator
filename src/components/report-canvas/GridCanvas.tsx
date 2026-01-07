'use client';

import { useState, useCallback, Children, ReactElement } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { Component } from '@/types/report-schema';

interface GridCanvasProps {
  components: Component[];
  onLayoutChange?: (layout: any[]) => void;
  editable?: boolean;
  showGrid?: boolean;
  children?: React.ReactNode;
}

/**
 * GridCanvas - Drag-drop grid layout for report components
 *
 * Features:
 * - 12-column responsive grid system
 * - Drag-drop component repositioning
 * - Resize components within grid
 * - Touch support for mobile
 * - Grid visualization (show/hide)
 */
export function GridCanvas({
  components,
  onLayoutChange,
  editable = true,
  showGrid = false,
  children,
}: GridCanvasProps) {
  // Convert component positions to react-grid-layout format
  const initialLayout = components.map((component) => {
    const layoutItem: any = {
      i: component.id,
      x: component.position.x,
      y: component.position.y,
      w: component.position.w,
      h: component.position.h,
    };
    if (component.position.minW) layoutItem.minW = component.position.minW;
    if (component.position.minH) layoutItem.minH = component.position.minH;
    return layoutItem;
  });

  const [layout, setLayout] = useState<any[]>(initialLayout);

  const handleLayoutChange = useCallback(
    (newLayout: any) => {
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    },
    [onLayoutChange]
  );

  return (
    <div
      className={`relative w-full ${
        showGrid
          ? 'bg-grid-pattern bg-[length:calc(100%/12)_80px]'
          : ''
      }`}
      style={{
        backgroundImage: showGrid
          ? 'linear-gradient(to right, oklch(0.88 0.005 240 / 0.2) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.88 0.005 240 / 0.2) 1px, transparent 1px)'
          : 'none',
        backgroundSize: showGrid ? 'calc(100% / 12) 80px' : '0',
      }}
    >
      <GridLayout
        {...({
          className: "layout",
          layout: layout,
          cols: 12,
          rowHeight: 80,
          margin: [16, 16],
          containerPadding: [0, 0],
          isDraggable: editable,
          isResizable: editable,
          onLayoutChange: handleLayoutChange,
          draggableHandle: ".drag-handle",
          resizeHandles: ['se', 'sw', 'ne', 'nw'],
          compactType: null,
          preventCollision: false,
          useCSSTransforms: true,
        } as any)}
      >
        {children
          ? // Render provided children
            Children.map(children, (child, index) => {
              const component = components[index];
              if (!component) return null;

              return (
                <div
                  key={component.id}
                  className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Drag handle */}
                  {editable && (
                    <div className="drag-handle cursor-move bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        {component.title || component.type}
                      </span>
                      <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Component content */}
                  <div className="flex-1 overflow-auto">
                    {child}
                  </div>
                </div>
              );
            })
          : // Fallback: render component placeholders
            components.map((component) => (
              <div
                key={component.id}
                className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
              >
                {/* Drag handle */}
                {editable && (
                  <div className="drag-handle cursor-move bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {component.title || component.type}
                    </span>
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>
                )}

                {/* Component content placeholder */}
                <div className="p-4 h-full">
                  <div className="text-sm text-muted-foreground">
                    {component.type} component
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Position: ({component.position.x}, {component.position.y})
                    <br />
                    Size: {component.position.w}x{component.position.h}
                  </div>
                </div>
              </div>
            ))}
      </GridLayout>
    </div>
  );
}
