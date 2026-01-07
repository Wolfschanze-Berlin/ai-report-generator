'use client';

import { ChartComponent as ChartComponentWrapper } from '@/components/report-canvas/ChartComponent';
import type { ChartComponent } from '@/types/report-schema';

interface ChartRendererProps {
  component: ChartComponent;
  theme?: 'light' | 'dark';
}

/**
 * ChartRenderer - Legacy wrapper for ChartComponent
 * @deprecated Use ChartComponent from report-canvas directly
 */
export function ChartRenderer({ component, theme }: ChartRendererProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ChartComponentWrapper component={component} theme={theme} />
    </div>
  );
}
