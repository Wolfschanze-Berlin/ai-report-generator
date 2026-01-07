'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions as ChartJSOptions,
} from 'chart.js';
import {
  Chart,
  Line,
  Bar,
  Pie,
  Doughnut,
  PolarArea,
  Radar,
  Scatter,
  Bubble,
} from 'react-chartjs-2';
import type { ChartComponent as ChartComponentType } from '@/types/report-schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartComponentProps {
  component: ChartComponentType;
  theme?: 'light' | 'dark';
}

export function ChartComponent({ component, theme = 'light' }: ChartComponentProps) {
  const chartRef = useRef<ChartJS>(null);
  const { chartType, chartData, chartOptions } = component.data;

  // Theme-aware default options
  const defaultOptions: ChartJSOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? 'oklch(0.96 0.003 240)' : 'oklch(0.15 0.012 240)',
          font: {
            family: 'var(--font-geist-sans)',
          },
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'oklch(0.20 0.010 240)' : 'oklch(0.99 0.002 240)',
        titleColor: theme === 'dark' ? 'oklch(0.96 0.003 240)' : 'oklch(0.15 0.012 240)',
        bodyColor: theme === 'dark' ? 'oklch(0.92 0.004 240)' : 'oklch(0.25 0.015 240)',
        borderColor: theme === 'dark' ? 'oklch(0.32 0.012 240)' : 'oklch(0.88 0.005 240)',
        borderWidth: 1,
      },
    },
    scales:
      chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea'
        ? undefined
        : {
            x: {
              grid: {
                color: theme === 'dark' ? 'oklch(0.32 0.012 240 / 0.3)' : 'oklch(0.88 0.005 240 / 0.5)',
              },
              ticks: {
                color: theme === 'dark' ? 'oklch(0.65 0.008 240)' : 'oklch(0.50 0.010 240)',
              },
            },
            y: {
              grid: {
                color: theme === 'dark' ? 'oklch(0.32 0.012 240 / 0.3)' : 'oklch(0.88 0.005 240 / 0.5)',
              },
              ticks: {
                color: theme === 'dark' ? 'oklch(0.65 0.008 240)' : 'oklch(0.50 0.010 240)',
              },
            },
          },
  };

  // Merge user options with defaults
  const mergedOptions = {
    ...defaultOptions,
    ...chartOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...chartOptions?.plugins,
    },
  };

  // Export chart as PNG
  const exportChart = (format: 'png' | 'svg' = 'png') => {
    const chart = chartRef.current;
    if (!chart) return;

    if (format === 'png') {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = `chart-${component.id}.png`;
      link.href = url;
      link.click();
    }
  };

  // Render appropriate chart type
  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: mergedOptions as any,
      'aria-label': component.title || `${chartType} chart`,
      role: 'img',
    };

    switch (chartType) {
      case 'line':
        return <Line {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'polarArea':
        return <PolarArea {...commonProps} />;
      case 'radar':
        return <Radar {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      case 'bubble':
        return <Bubble {...commonProps} />;
      case 'mixed':
        // Mixed charts use the base Chart component
        return <Chart type="bar" {...commonProps} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Export button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={() => exportChart('png')}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
          aria-label="Export chart as PNG"
          title="Export as PNG"
        >
          <svg
            className="w-4 h-4 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div className="w-full h-full p-2">{renderChart()}</div>

      {/* Accessibility: Chart data summary for screen readers */}
      <div className="sr-only">
        <p>Chart type: {chartType}</p>
        <p>Labels: {chartData.labels.join(', ')}</p>
        {chartData.datasets.map((dataset, idx) => (
          <p key={idx}>
            {dataset.label}: {dataset.data.join(', ')}
          </p>
        ))}
      </div>
    </div>
  );
}
