'use client';

import type { KPIComponent } from '@/types/report-schema';

interface KPICardProps {
  component: KPIComponent;
}

export function KPICard({ component }: KPICardProps) {
  const { label, value, format, trend, color } = component.data;

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      default:
        return val.toString();
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.direction === 'up') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const trendColor = trend?.direction === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4" style={{ borderLeftColor: color || '#3b82f6' }}>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {label}
        </span>
        <span className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formatValue(value)}
        </span>
        {trend && (
          <div className="flex items-center gap-1">
            <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              {getTrendIcon()}
              {trend.value}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
