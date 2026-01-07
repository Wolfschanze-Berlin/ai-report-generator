'use client';

import { useState } from 'react';
import type { Report } from '@/types/report-schema';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { KPICard } from '@/components/charts/KPICard';
import {
  RevenueComparisonChart,
  RegionalSalesChart,
  YearlySalesTrendChart,
} from '@/components/charts/ShadcnCharts';

/**
 * Demo Report Template
 *
 * Sample report demonstrating all component types.
 */
const demoReport: Report = {
  title: 'Q4 2024 Sales Performance Dashboard',
  description: 'Comprehensive analysis of sales metrics, trends, and key performance indicators',
  generatedAt: new Date().toISOString(),
  metadata: {
    author: 'AI Report Generator',
    version: '1.0.0',
    tags: ['sales', 'q4', 'performance', 'demo'],
  },
  layout: {
    type: 'grid',
    columns: 12,
    gap: 16,
  },
  components: [
    // Header Section
    {
      id: 'header',
      type: 'markdown',
      position: { x: 0, y: 0, width: 12, height: 2 },
      data: {
        content: `# Q4 2024 Sales Performance Dashboard

**Generated:** ${new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}

This dashboard provides a comprehensive overview of sales performance metrics for Q4 2024, including revenue trends, regional performance, and key performance indicators.`,
      },
    },

    // KPI Cards Row
    {
      id: 'kpi-revenue',
      type: 'kpi',
      position: { x: 0, y: 2, width: 3, height: 3 },
      data: {
        label: 'Total Revenue',
        value: '$2.4M',
        format: 'currency',
        trend: {
          direction: 'up',
          value: 12.5,
          label: 'vs Q3 2024',
        },
        color: '#10b981',
      },
    },
    {
      id: 'kpi-orders',
      type: 'kpi',
      position: { x: 3, y: 2, width: 3, height: 3 },
      data: {
        label: 'Total Orders',
        value: '1,847',
        format: 'number',
        trend: {
          direction: 'up',
          value: 8.3,
          label: 'vs Q3 2024',
        },
        color: '#3b82f6',
      },
    },
    {
      id: 'kpi-conversion',
      type: 'kpi',
      position: { x: 6, y: 2, width: 3, height: 3 },
      data: {
        label: 'Conversion Rate',
        value: '3.2%',
        format: 'percentage',
        trend: {
          direction: 'up',
          value: 0.5,
          label: 'vs Q3 2024',
        },
        color: '#8b5cf6',
      },
    },
    {
      id: 'kpi-avg-order',
      type: 'kpi',
      position: { x: 9, y: 2, width: 3, height: 3 },
      data: {
        label: 'Avg Order Value',
        value: '$1,299',
        format: 'currency',
        trend: {
          direction: 'down',
          value: 2.1,
          label: 'vs Q3 2024',
        },
        color: '#f59e0b',
      },
    },

    // Revenue Chart
    {
      id: 'revenue-chart',
      type: 'chart',
      position: { x: 0, y: 5, width: 8, height: 6 },
      data: {
        chartType: 'line',
        data: {
          labels: ['Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Revenue 2024',
              data: [720000, 850000, 830000],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Revenue 2023',
              data: [680000, 750000, 720000],
              borderColor: '#94a3b8',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Revenue Comparison (2024 vs 2023)',
            },
            legend: {
              position: 'bottom',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => '$' + (value / 1000) + 'K',
              },
            },
          },
        },
      },
    },

    // Regional Distribution Pie Chart
    {
      id: 'regional-chart',
      type: 'chart',
      position: { x: 8, y: 5, width: 4, height: 6 },
      data: {
        chartType: 'doughnut',
        data: {
          labels: ['North', 'South', 'East', 'West'],
          datasets: [
            {
              label: 'Revenue by Region',
              data: [680000, 520000, 750000, 450000],
              backgroundColor: [
                '#3b82f6',
                '#10b981',
                '#f59e0b',
                '#8b5cf6',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Revenue Distribution by Region',
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      },
    },

    // Top Products Table
    {
      id: 'top-products',
      type: 'table',
      position: { x: 0, y: 11, width: 12, height: 5 },
      data: {
        columns: [
          { key: 'product', label: 'Product', type: 'string' },
          { key: 'revenue', label: 'Revenue', type: 'currency' },
          { key: 'units', label: 'Units Sold', type: 'number' },
          { key: 'growth', label: 'Growth', type: 'percentage' },
        ],
        rows: [
          { product: 'Enterprise Suite Pro', revenue: 450000, units: 1250, growth: 15.2 },
          { product: 'Analytics Dashboard', revenue: 380000, units: 2100, growth: 22.8 },
          { product: 'Cloud Storage Plus', revenue: 320000, units: 3400, growth: -3.5 },
          { product: 'Security Package', revenue: 285000, units: 1680, growth: 8.9 },
          { product: 'Mobile App Suite', revenue: 240000, units: 5200, growth: 31.4 },
        ],
        sortable: true,
        pagination: {
          enabled: false,
        },
      },
    },

    // Sales Funnel Diagram
    {
      id: 'sales-funnel',
      type: 'mermaid',
      position: { x: 0, y: 16, width: 6, height: 6 },
      data: {
        diagram: `graph TB
    A[Website Visitors<br/>58,420] --> B[Product Views<br/>24,680]
    B --> C[Add to Cart<br/>8,940]
    C --> D[Checkout Started<br/>4,120]
    D --> E[Orders Completed<br/>1,847]

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#10b981,stroke:#059669,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff`,
      },
    },

    // Key Insights
    {
      id: 'insights',
      type: 'markdown',
      position: { x: 6, y: 16, width: 6, height: 6 },
      data: {
        content: `## Key Insights

### 📈 Performance Highlights
- **Revenue Growth:** 12.5% increase over Q3, driven by strong holiday sales
- **Regional Leader:** East region leads with $750K (31.3% of total)
- **Top Performer:** Enterprise Suite Pro generated $450K revenue

### ⚠️ Areas of Concern
- **Conversion Rate:** At 3.2%, still below industry average of 4.5%
- **Cart Abandonment:** 54% drop-off from cart to checkout
- **Cloud Storage:** -3.5% growth suggests competitive pressure

### 🎯 Recommendations
1. Optimize checkout process to reduce abandonment
2. Implement retargeting campaigns for cart abandoners
3. Review Cloud Storage pricing and features
4. Focus marketing spend on high-performing East region`,
      },
    },
  ],
};

export default function DemoPage() {
  const [report] = useState<Report>(demoReport);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {report.title}
              </h1>
              {report.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {report.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </span>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Export PDF
              </button>
            </div>
          </div>
          {report.metadata?.tags && (
            <div className="flex gap-2 mt-3">
              {report.metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visual Report Rendering */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Live Report Preview
          </h2>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {report.components
              .filter((c) => c.type === 'kpi')
              .map((component) => (
                <KPICard key={component.id} component={component as any} />
              ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {report.components
              .filter((c) => c.type === 'chart')
              .map((component) => (
                <div
                  key={component.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {component.id.split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h3>
                  <div className="h-[400px]">
                    <ChartRenderer component={component as any} />
                  </div>
                </div>
              ))}
          </div>

          {/* Table Section */}
          {report.components
            .filter((c) => c.type === 'table')
            .map((component) => (
              <div
                key={component.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Products Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {(component.data as any).columns.map((col: any) => (
                          <th
                            key={col.key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {(component.data as any).rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {(component.data as any).columns.map((col: any) => (
                            <td
                              key={col.key}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {col.type === 'currency'
                                ? new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                  }).format(row[col.key])
                                : col.type === 'percentage'
                                ? `${row[col.key]}%`
                                : col.type === 'number'
                                ? new Intl.NumberFormat('en-US').format(row[col.key])
                                : row[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>

        {/* Shadcn/Recharts Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Shadcn/Recharts Visualizations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueComparisonChart />
            <RegionalSalesChart />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <YearlySalesTrendChart />
          </div>
        </div>

        {/* Component Schema Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Component Schema Details ({report.components.length} components)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Click any component below to view its JSON data structure.
            </p>
          </div>

          {/* Component List */}
          <div className="space-y-4">
            {report.components.map((component) => (
              <div
                key={component.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedComponent === component.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedComponent(
                  selectedComponent === component.id ? null : component.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                        {component.type.toUpperCase()}
                      </span>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {component.id}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Position: ({component.position.x}, {component.position.y}) |
                      Size: {component.position.width} × {component.position.height}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                  >
                    {selectedComponent === component.id ? 'Hide' : 'Show'} Details
                  </button>
                </div>

                {/* Component Data Preview */}
                {selectedComponent === component.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-96">
                      {JSON.stringify(component.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schema Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 Report Schema Information
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Total Components:</strong> {report.components.length}
            </p>
            <p>
              <strong>Layout:</strong> {report.layout.type} ({report.layout.columns} columns)
            </p>
            <p>
              <strong>Component Types:</strong>{' '}
              {[...new Set(report.components.map((c) => c.type))].join(', ')}
            </p>
            <p>
              <strong>Status:</strong> This is a demo template. Actual rendering components will be implemented in M2 milestone.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🚀 Implementation Roadmap
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>M1: Foundation (80% Complete)</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  TypeScript types, Windmill integration, Data Gateway established
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">⏳</span>
              <div>
                <strong>M2: Reporting Canvas & Visualization</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Implement Chart.js components, Mermaid diagrams, drag-drop grid
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400">⏹</span>
              <div>
                <strong>M3: AI Agent System</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Analysis agent, clarification agent, multi-agent orchestration
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
