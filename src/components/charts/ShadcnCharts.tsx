'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const revenueComparisonConfig = {
  current: {
    label: 'Q4 2024',
    color: 'hsl(var(--chart-1))',
  },
  previous: {
    label: 'Q4 2023',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const regionalSalesConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const monthlySalesConfig = {
  sales: {
    label: 'Monthly Sales',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const revenueComparisonData = [
  { month: 'Oct', current: 125000, previous: 98000 },
  { month: 'Nov', current: 142000, previous: 115000 },
  { month: 'Dec', current: 185000, previous: 142000 },
];

const regionalSalesData = [
  { region: 'North America', sales: 285000 },
  { region: 'Europe', sales: 195000 },
  { region: 'Asia Pacific', sales: 142000 },
  { region: 'Latin America', sales: 78000 },
];

const monthlySalesData = [
  { month: 'Jan', sales: 98000 },
  { month: 'Feb', sales: 105000 },
  { month: 'Mar', sales: 112000 },
  { month: 'Apr', sales: 118000 },
  { month: 'May', sales: 125000 },
  { month: 'Jun', sales: 132000 },
  { month: 'Jul', sales: 128000 },
  { month: 'Aug', sales: 135000 },
  { month: 'Sep', sales: 142000 },
  { month: 'Oct', sales: 125000 },
  { month: 'Nov', sales: 142000 },
  { month: 'Dec', sales: 185000 },
];

export function RevenueComparisonChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Comparison (Shadcn/Recharts)</CardTitle>
        <CardDescription>Q4 2024 vs Q4 2023</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueComparisonConfig} className="h-[300px] w-full">
          <LineChart data={revenueComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2}
              name={revenueComparisonConfig.current.label}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeWidth={2}
              name={revenueComparisonConfig.previous.label}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function RegionalSalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Sales Distribution (Shadcn/Recharts)</CardTitle>
        <CardDescription>Sales by region for Q4 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={regionalSalesConfig} className="h-[300px] w-full">
          <BarChart data={regionalSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function YearlySalesTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2024 Sales Trend (Shadcn/Recharts)</CardTitle>
        <CardDescription>Monthly sales performance throughout the year</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={monthlySalesConfig} className="h-[300px] w-full">
          <AreaChart data={monthlySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              fill="var(--color-sales)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
