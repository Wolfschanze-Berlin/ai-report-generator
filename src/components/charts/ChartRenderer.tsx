'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import type { ChartComponent } from '@/types/report-schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartRendererProps {
  component: ChartComponent;
}

export function ChartRenderer({ component }: ChartRendererProps) {
  const { chartType, data, options } = component.data;

  // Merge options with responsive defaults
  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    ...options,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'pie':
        return <Pie data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Chart type "{chartType}" not supported
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] p-4">
      {renderChart()}
    </div>
  );
}
