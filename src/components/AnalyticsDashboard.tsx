'use client';

import { useMemo } from 'react';
import { Sparkles, AlertCircle, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useGetIdeasQuery } from '@/store/api/ideasApi';
import { calculateConversionAnalytics } from '@/utils/stageAnalytics';
import {
  AnalyticsDashboardSkeleton,
  AnalyticsKpiCards,
  StageDurationAnalytics,
  ConversionFunnel,
  ProductionMilestones,
} from './analytics';

export function AnalyticsDashboard() {
  const { data: ideas = [], isLoading: loading, error } = useGetIdeasQuery();

  // Stage & Conversion analytics calculation
  const conversionData = useMemo(() => {
    if (!ideas.length) return null;
    return calculateConversionAnalytics(ideas);
  }, [ideas]);

  if (error) {
    const errorMsg =
      'status' in error ? JSON.stringify(error.data) : (error as any).message || 'Failed to load analytics';
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{errorMsg}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <AnalyticsDashboardSkeleton />;
  }

  if (!conversionData) {
    return (
      <Card className="py-16 text-center border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <h3 className="font-semibold text-foreground">No Analytics Data Available</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Start by adding your first content idea to generate conversion and velocity metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalIdeas,
    researched,
    formats,
    articlePipeline,
    videoPipeline,
    stageDurations,
    funnelSteps,
  } = conversionData;

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Content Velocity &amp; Funnel Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time stage turnaround durations, pipeline bottlenecks, and end-to-end conversion rates.
          </p>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <AnalyticsKpiCards
        totalIdeas={totalIdeas}
        researched={researched}
        articlePipeline={articlePipeline}
        videoPipeline={videoPipeline}
        formats={formats}
      />

      {/* Turnaround & Stage Durations with Chart */}
      <StageDurationAnalytics stageDurations={stageDurations} />

      {/* Conversion & Drop-off Funnel */}
      <ConversionFunnel
        totalIdeas={totalIdeas}
        researched={researched}
        formats={formats}
        funnelSteps={funnelSteps}
      />

      {/* Sub-Stage Production Milestones */}
      <ProductionMilestones
        articlePipeline={articlePipeline}
        videoPipeline={videoPipeline}
      />
    </div>
  );
}
