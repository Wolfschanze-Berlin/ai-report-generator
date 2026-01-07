'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import type { MermaidComponent } from '@/types/report-schema';

interface MermaidDiagramProps {
  component: MermaidComponent;
}

export function MermaidDiagram({ component }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { diagram, theme = 'default' } = component.data;

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize mermaid with theme
    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    // Generate unique ID for this diagram
    const id = `mermaid-${component.id}-${Date.now()}`;

    // Render the diagram
    mermaid
      .render(id, diagram)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((error) => {
        console.error('Mermaid render error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">
                <strong>Error rendering diagram:</strong> ${error.message}
              </p>
              <pre class="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">${diagram}</pre>
            </div>
          `;
        }
      });
  }, [diagram, theme, component.id]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {component.id
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </h3>
      <div
        ref={containerRef}
        className="mermaid-diagram flex justify-center items-center min-h-[200px]"
      />
    </div>
  );
}
