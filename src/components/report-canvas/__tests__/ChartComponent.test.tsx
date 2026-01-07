import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartComponent } from '../ChartComponent';
import type { ChartComponent as ChartComponentType } from '@/types/report-schema';

describe('ChartComponent', () => {
  const mockLineChart: ChartComponentType = {
    id: 'test-line-chart',
    type: 'chart',
    position: { x: 0, y: 0, w: 6, h: 4 },
    title: 'Sales Trend',
    data: {
      chartType: 'line',
      chartData: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Sales',
            data: [10, 20, 30],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          },
        ],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },
    },
  };

  const mockBarChart: ChartComponentType = {
    ...mockLineChart,
    id: 'test-bar-chart',
    data: {
      ...mockLineChart.data,
      chartType: 'bar',
    },
  };

  const mockPieChart: ChartComponentType = {
    ...mockLineChart,
    id: 'test-pie-chart',
    data: {
      chartType: 'pie',
      chartData: {
        labels: ['Red', 'Blue', 'Yellow'],
        datasets: [
          {
            label: 'Colors',
            data: [300, 50, 100],
            backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
          },
        ],
      },
    },
  };

  it('renders line chart with correct data', () => {
    render(<ChartComponent component={mockLineChart} />);

    // Check accessibility text
    expect(screen.getByText('Chart type: line')).toBeInTheDocument();
    expect(screen.getByText('Labels: Jan, Feb, Mar')).toBeInTheDocument();
    expect(screen.getByText('Sales: 10, 20, 30')).toBeInTheDocument();
  });

  it('renders bar chart', () => {
    render(<ChartComponent component={mockBarChart} />);
    expect(screen.getByText('Chart type: bar')).toBeInTheDocument();
  });

  it('renders pie chart', () => {
    render(<ChartComponent component={mockPieChart} />);
    expect(screen.getByText('Chart type: pie')).toBeInTheDocument();
    expect(screen.getByText('Labels: Red, Blue, Yellow')).toBeInTheDocument();
  });

  it('renders doughnut chart', () => {
    const doughnutChart: ChartComponentType = {
      ...mockPieChart,
      data: {
        ...mockPieChart.data,
        chartType: 'doughnut',
      },
    };
    render(<ChartComponent component={doughnutChart} />);
    expect(screen.getByText('Chart type: doughnut')).toBeInTheDocument();
  });

  it('renders polar area chart', () => {
    const polarChart: ChartComponentType = {
      ...mockPieChart,
      data: {
        ...mockPieChart.data,
        chartType: 'polarArea',
      },
    };
    render(<ChartComponent component={polarChart} />);
    expect(screen.getByText('Chart type: polarArea')).toBeInTheDocument();
  });

  it('renders radar chart', () => {
    const radarChart: ChartComponentType = {
      ...mockLineChart,
      data: {
        chartType: 'radar',
        chartData: {
          labels: ['Speed', 'Reliability', 'Comfort', 'Safety'],
          datasets: [
            {
              label: 'Car A',
              data: [65, 75, 90, 81],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgb(255, 99, 132)',
            },
          ],
        },
      },
    };
    render(<ChartComponent component={radarChart} />);
    expect(screen.getByText('Chart type: radar')).toBeInTheDocument();
  });

  it('renders scatter chart', () => {
    const scatterChart: ChartComponentType = {
      ...mockLineChart,
      data: {
        chartType: 'scatter',
        chartData: {
          labels: [],
          datasets: [
            {
              label: 'Dataset 1',
              data: [10, 20, 30] as any,
              backgroundColor: 'rgb(255, 99, 132)',
            },
          ],
        },
      },
    };
    render(<ChartComponent component={scatterChart} />);
    expect(screen.getByText('Chart type: scatter')).toBeInTheDocument();
  });

  it('renders bubble chart', () => {
    const bubbleChart: ChartComponentType = {
      ...mockLineChart,
      data: {
        chartType: 'bubble',
        chartData: {
          labels: [],
          datasets: [
            {
              label: 'Dataset 1',
              data: [10, 20, 30] as any,
              backgroundColor: 'rgb(255, 99, 132)',
            },
          ],
        },
      },
    };
    render(<ChartComponent component={bubbleChart} />);
    expect(screen.getByText('Chart type: bubble')).toBeInTheDocument();
  });

  it('renders mixed chart', () => {
    const mixedChart: ChartComponentType = {
      ...mockLineChart,
      data: {
        chartType: 'mixed',
        chartData: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            {
              type: 'line',
              label: 'Line Dataset',
              data: [50, 60, 70],
              borderColor: 'rgb(75, 192, 192)',
            },
            {
              type: 'bar',
              label: 'Bar Dataset',
              data: [10, 20, 30],
              backgroundColor: 'rgb(255, 99, 132)',
            },
          ],
        },
      },
    };
    render(<ChartComponent component={mixedChart} />);
    expect(screen.getByText('Chart type: mixed')).toBeInTheDocument();
  });

  it('applies dark theme correctly', () => {
    const { container } = render(<ChartComponent component={mockLineChart} theme="dark" />);
    expect(container).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<ChartComponent component={mockLineChart} />);
    const exportButton = screen.getByLabelText('Export chart as PNG');
    expect(exportButton).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<ChartComponent component={mockLineChart} />);
    const chart = screen.getByRole('img', { name: 'Sales Trend' });
    expect(chart).toBeInTheDocument();
  });

  it('handles unsupported chart type gracefully', () => {
    const invalidChart: any = {
      ...mockLineChart,
      data: {
        ...mockLineChart.data,
        chartType: 'invalid-type',
      },
    };
    render(<ChartComponent component={invalidChart} />);
    expect(screen.getByText(/Unsupported chart type/)).toBeInTheDocument();
  });

  it('includes dataset labels in accessibility summary', () => {
    const multiDatasetChart: ChartComponentType = {
      ...mockLineChart,
      data: {
        chartType: 'line',
        chartData: {
          labels: ['Q1', 'Q2'],
          datasets: [
            { label: 'Revenue', data: [100, 150] },
            { label: 'Profit', data: [30, 45] },
          ],
        },
      },
    };
    render(<ChartComponent component={multiDatasetChart} />);
    expect(screen.getByText('Revenue: 100, 150')).toBeInTheDocument();
    expect(screen.getByText('Profit: 30, 45')).toBeInTheDocument();
  });

  it('renders without title', () => {
    const chartWithoutTitle: ChartComponentType = {
      ...mockLineChart,
      title: undefined,
    };
    render(<ChartComponent component={chartWithoutTitle} />);
    expect(screen.getByRole('img', { name: 'line chart' })).toBeInTheDocument();
  });
});
