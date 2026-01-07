'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { Report } from '@/types/report-schema';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { KPIComponent } from '@/components/report-canvas/KPIComponent';
import { MarkdownComponent } from '@/components/report-canvas/MarkdownComponent';
import { AlertCircle, Play, Sparkles } from 'lucide-react';

type Step = 'input' | 'windmill' | 'agent' | 'report' | 'error';

interface AnalysisState {
  step: Step;
  userPrompt: string;
  reportTitle: string;
  opensearchQuery: string;
  windmillData: any[] | null;
  report: Report | null;
  error: string | null;
  processingTime: {
    windmill: number | null;
    agent: number | null;
    total: number | null;
  };
}

export default function DashboardPage() {
  const [state, setState] = useState<AnalysisState>({
    step: 'input',
    userPrompt: 'Analyze user activity patterns. Identify key trends, peak usage times, and interesting behaviors.',
    reportTitle: 'User Activity Analysis',
    opensearchQuery: JSON.stringify({
      query: {
        bool: {
          filter: [
            {
              range: {
                'query.endDate': {
                  gte: 'now-7d',
                  lte: 'now'
                }
              }
            }
          ]
        }
      },
      size: 1000,
      sort: [{ 'query.endDate': { order: 'desc' } }]
    }, null, 2),
    windmillData: null,
    report: null,
    error: null,
    processingTime: {
      windmill: null,
      agent: null,
      total: null,
    },
  });

  const handleGenerate = async () => {
    const startTime = Date.now();

    try {
      // Step 1: Fetch data from Windmill
      setState(prev => ({ ...prev, step: 'windmill', error: null }));

      const windmillStart = Date.now();
      const windmillResponse = await fetch('/api/windmill/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: JSON.parse(state.opensearchQuery) }),
      });

      if (!windmillResponse.ok) {
        throw new Error(`Windmill API failed: ${windmillResponse.statusText}`);
      }

      const windmillData = await windmillResponse.json();
      const windmillTime = Date.now() - windmillStart;

      setState(prev => ({
        ...prev,
        windmillData: windmillData.records || [],
        processingTime: { ...prev.processingTime, windmill: windmillTime },
      }));

      // Step 2: Analyze with AI Agent
      setState(prev => ({ ...prev, step: 'agent' }));

      const agentStart = Date.now();
      const agentResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: windmillData.records || [],
          userPrompt: state.userPrompt,
          title: state.reportTitle,
          skipClarification: true,
        }),
      });

      if (!agentResponse.ok) {
        throw new Error(`Analysis API failed: ${agentResponse.statusText}`);
      }

      const agentResult = await agentResponse.json();
      const agentTime = Date.now() - agentStart;
      const totalTime = Date.now() - startTime;

      // Step 3: Display report
      setState(prev => ({
        ...prev,
        step: 'report',
        report: agentResult.report,
        processingTime: {
          windmill: windmillTime,
          agent: agentTime,
          total: totalTime,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'input',
      userPrompt: state.userPrompt,
      reportTitle: state.reportTitle,
      opensearchQuery: state.opensearchQuery,
      windmillData: null,
      report: null,
      error: null,
      processingTime: {
        windmill: null,
        agent: null,
        total: null,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Report Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Query → Analyze → Visualize
                </p>
              </div>
            </div>
            <a
              href="/"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        {state.step === 'input' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configure Your Analysis</CardTitle>
                <CardDescription>
                  Describe what insights you want to generate from your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Title
                  </label>
                  <Input
                    value={state.reportTitle}
                    onChange={(e) => setState(prev => ({ ...prev, reportTitle: e.target.value }))}
                    placeholder="User Activity Analysis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What would you like to analyze?
                  </label>
                  <Textarea
                    value={state.userPrompt}
                    onChange={(e) => setState(prev => ({ ...prev, userPrompt: e.target.value }))}
                    placeholder="Describe what insights you want... e.g., 'Analyze user activity patterns and identify key trends'"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing States */}
        {(state.step === 'windmill' || state.step === 'agent') && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Spinner className="w-12 h-12" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {state.step === 'windmill' && 'Fetching data from Windmill...'}
                    {state.step === 'agent' && 'Analyzing data with AI...'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {state.step === 'windmill' && `Processing OpenSearch query (typically 3-10 seconds)`}
                    {state.step === 'agent' && `Generating insights with Claude 4.5 (typically 20-60 seconds)`}
                  </p>
                  {state.processingTime.windmill && state.step === 'agent' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ Windmill: {(state.processingTime.windmill / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {state.step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {state.error}
              </AlertDescription>
            </Alert>
            <Button onClick={handleReset} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Report Display */}
        {state.step === 'report' && state.report && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Windmill Query</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {state.processingTime.windmill && `${(state.processingTime.windmill / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI Analysis</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {state.processingTime.agent && `${(state.processingTime.agent / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {state.processingTime.total && `${(state.processingTime.total / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data points analyzed: <strong>{state.windmillData?.length || 0}</strong>
                  </p>
                  <Button onClick={handleReset} variant="outline" className="mt-4">
                    Generate New Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{state.report.title}</CardTitle>
                    {state.report.description && (
                      <CardDescription className="mt-2">{state.report.description}</CardDescription>
                    )}
                  </div>
                  <Button variant="outline">Export PDF</Button>
                </div>
              </CardHeader>
            </Card>

            {/* KPI Cards */}
            {state.report.components.filter(c => c.type === 'kpi').length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {state.report.components
                  .filter(c => c.type === 'kpi')
                  .map((component) => (
                    <KPIComponent key={component.id} component={component as any} />
                  ))}
              </div>
            )}

            {/* Charts */}
            {state.report.components.filter(c => c.type === 'chart').length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {state.report.components
                  .filter(c => c.type === 'chart')
                  .map((component) => (
                    <Card key={component.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{component.title || component.id}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          <ChartRenderer component={component as any} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Tables */}
            {state.report.components
              .filter(c => c.type === 'table')
              .map((component) => (
                <Card key={component.id}>
                  <CardHeader>
                    <CardTitle>{component.title || 'Data Table'}</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}

            {/* Markdown Components */}
            {state.report.components
              .filter(c => c.type === 'markdown')
              .map((component) => (
                <Card key={component.id}>
                  <CardContent className="pt-6">
                    <MarkdownComponent component={component as any} />
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
