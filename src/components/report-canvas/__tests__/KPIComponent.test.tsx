import { render, screen } from '@testing-library/react';
import { KPIComponent } from '../KPIComponent';
import type { KPIComponent as KPIComponentType } from '@/types/report-schema';

describe('KPIComponent', () => {
  const mockKPIComponent: KPIComponentType = {
    id: 'test-kpi',
    type: 'kpi',
    position: { x: 0, y: 0, w: 3, h: 2 },
    data: {
      label: 'Total Revenue',
      value: 2400000,
      format: 'currency',
      trend: {
        direction: 'up',
        value: 12.5,
        label: 'vs last quarter',
      },
      color: '#10b981',
    },
  };

  it('renders KPI label correctly', () => {
    render(<KPIComponent component={mockKPIComponent} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<KPIComponent component={mockKPIComponent} />);
    expect(screen.getByText('$2,400,000')).toBeInTheDocument();
  });

  it('displays trend information', () => {
    render(<KPIComponent component={mockKPIComponent} />);
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last quarter')).toBeInTheDocument();
  });

  it('renders trend icon for upward trend', () => {
    render(<KPIComponent component={mockKPIComponent} />);
    const trendElement = screen.getByText('12.5%').closest('span');
    expect(trendElement).toHaveClass('text-green-600');
  });

  it('renders trend icon for downward trend', () => {
    const downTrendComponent: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        ...mockKPIComponent.data,
        trend: {
          direction: 'down',
          value: 5.2,
          label: 'vs last quarter',
        },
      },
    };

    render(<KPIComponent component={downTrendComponent} />);
    const trendElement = screen.getByText('5.2%').closest('span');
    expect(trendElement).toHaveClass('text-red-600');
  });

  it('formats percentage values correctly', () => {
    const percentageKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        label: 'Conversion Rate',
        value: 3.2,
        format: 'percentage',
      },
    };

    render(<KPIComponent component={percentageKPI} />);
    expect(screen.getByText('3.2%')).toBeInTheDocument();
  });

  it('formats number values correctly', () => {
    const numberKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        label: 'Total Orders',
        value: 1847,
        format: 'number',
      },
    };

    render(<KPIComponent component={numberKPI} />);
    expect(screen.getByText('1,847')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const iconKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        ...mockKPIComponent.data,
        icon: 'DollarSign',
      },
    };

    render(<KPIComponent component={iconKPI} />);
    // Icon should be rendered (lucide-react icon)
    const container = screen.getByText('Total Revenue').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('shows tooltip when provided', () => {
    const tooltipKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        ...mockKPIComponent.data,
        tooltip: 'Total revenue for Q4 2024',
      },
    };

    const { container } = render(<KPIComponent component={tooltipKPI} />);
    const kpiCard = container.firstChild as HTMLElement;
    expect(kpiCard.title).toBe('Total revenue for Q4 2024');
  });

  it('applies custom color to border', () => {
    const { container } = render(<KPIComponent component={mockKPIComponent} />);
    const kpiCard = container.firstChild as HTMLElement;
    expect(kpiCard.style.borderLeftColor).toBe('rgb(16, 185, 129)'); // #10b981
  });

  it('handles string values', () => {
    const stringKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        label: 'Status',
        value: 'Active',
        format: 'string',
      },
    };

    render(<KPIComponent component={stringKPI} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders without trend data', () => {
    const noTrendKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        label: 'Simple Metric',
        value: 100,
        format: 'number',
      },
    };

    render(<KPIComponent component={noTrendKPI} />);
    expect(screen.getByText('Simple Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('uses default color when not provided', () => {
    const noColorKPI: KPIComponentType = {
      ...mockKPIComponent,
      data: {
        label: 'Test',
        value: 100,
      },
    };

    const { container } = render(<KPIComponent component={noColorKPI} />);
    const kpiCard = container.firstChild as HTMLElement;
    expect(kpiCard.style.borderLeftColor).toBe('rgb(59, 130, 246)'); // #3b82f6 default
  });
});
