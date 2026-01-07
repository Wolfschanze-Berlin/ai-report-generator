'use client';

import * as LucideIcons from 'lucide-react';
import type { KPIComponent as KPIComponentType } from '@/types/report-schema';

interface KPIComponentProps {
  component: KPIComponentType;
}

export function KPIComponent({ component }: KPIComponentProps) {
  const { label, value, format, trend, color, icon, tooltip } = component.data;

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

    const TrendIcon = trend.direction === 'up' ? LucideIcons.TrendingUp : LucideIcons.TrendingDown;
    return <TrendIcon className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Render optional icon from lucide-react
  const renderIcon = () => {
    if (!icon) return null;

    // Get icon component dynamically
    const IconComponent = (LucideIcons as any)[icon];
    if (!IconComponent) return null;

    return (
      <div className="mb-3">
        <IconComponent className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-l-4 relative group"
      style={{ borderLeftColor: color || '#3b82f6' }}
      title={tooltip}
    >
      {/* Tooltip on hover */}
      {tooltip && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {tooltip}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {renderIcon()}

        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {label}
        </span>

        {/* Animated value with CSS transitions */}
        <span
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-300 ease-in-out animate-fade-in"
          key={value}
        >
          {formatValue(value)}
        </span>

        {trend && (
          <div className="flex items-center gap-1 transition-all duration-300 ease-in-out animate-slide-in">
            <span className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
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
