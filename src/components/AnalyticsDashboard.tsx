'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, CheckCircle, FileText, AlertCircle, Clock, 
  Hourglass, Sparkles, Layers, Film, Scissors, Upload, Video, 
  ArrowRight, ArrowDownRight, ArrowUpRight, Zap, BarChart3, 
  Search, BookOpen, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';
import { calculateConversionAnalytics } from '@/lib/stageAnalytics';
import { StageDurationStat } from '@/types';

export function AnalyticsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: ideas, loading, error, hasFetched } = useSelector((state: RootState) => state.ideas);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchIdeas());
    }
  }, [dispatch, hasFetched]);

  // Stage & Conversion analytics calculation
  const conversionData = useMemo(() => {
    if (!ideas.length) return null;
    return calculateConversionAnalytics(ideas);
  }, [ideas]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading || !hasFetched) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="p-4"><Skeleton className="h-[280px] rounded-md" /></CardContent></Card>
          <Card><CardContent className="p-4"><Skeleton className="h-[280px] rounded-md" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!conversionData) {
    return (
      <div className="py-16 text-center border border-dashed rounded-2xl">
        <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <h3 className="font-semibold text-foreground">No Analytics Data Available</h3>
        <p className="text-xs text-muted-foreground mt-1">Start by adding your first content idea to generate conversion metrics.</p>
      </div>
    );
  }

  const { 
    totalIdeas, 
    researched, 
    formats, 
    articlePipeline, 
    videoPipeline, 
    stageDurations, 
    funnelSteps 
  } = conversionData;

  const tooltipStyle = { 
    backgroundColor: 'var(--card)', 
    borderColor: 'var(--border)', 
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--card-foreground)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };
  const axisStyle = { fill: 'var(--muted-foreground)', fontSize: 11 };
  const gridStroke = 'var(--border)';

  // Stage duration chart data
  const stageDurationChartData = stageDurations.chartStages.map(s => ({
    name: s.stageName,
    avgHours: Number(s.avgHours.toFixed(1)),
    avgDays: Number(s.avgDays.toFixed(1)),
    samples: s.sampleCount,
    formatted: s.formattedAvg,
    color: s.color,
  }));


  return (
    <div className="space-y-7 pb-10">
      {/* Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Content &amp; Conversion Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Stage turnaround durations, pipeline bottlenecks, and end-to-end conversion intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {totalIdeas} Total Ideas Tracked
          </span>
        </div>
      </div>

      {/* 1. Core Conversion & Production KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Ideas */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Ideas</span>
              <Sparkles className="w-4 h-4 text-primary opacity-80" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalIdeas}</p>
            <p className="text-[10px] text-muted-foreground">Brainstormed pool</p>
          </CardContent>
        </Card>

        {/* Ideas Researched */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Researched</span>
              <BookOpen className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{researched.count}</p>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{researched.rate.toFixed(0)}%</span> conversion rate
            </p>
          </CardContent>
        </Card>

        {/* Articles Created */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Articles</span>
              <FileText className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{articlePipeline.total}</p>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{articlePipeline.published}</span> published ({articlePipeline.publishRate.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        {/* Videos Created */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Videos</span>
              <Video className="w-4 h-4 text-rose-500 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{videoPipeline.total}</p>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-rose-600 dark:text-rose-400">{videoPipeline.uploaded}</span> uploaded ({videoPipeline.uploadRate.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        {/* Dual Formats */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Both Formats</span>
              <Layers className="w-4 h-4 text-violet-500 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formats.both}</p>
            <p className="text-[10px] text-muted-foreground">Article + Video combo</p>
          </CardContent>
        </Card>

        {/* Unresearched / Dropped */}
        <Card className="rounded-xl border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unresearched</span>
              <Hourglass className="w-4 h-4 text-amber-500 opacity-80" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{researched.unresearchedCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending research ({researched.unresearchedRate.toFixed(0)}%)</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Stage-by-Stage Time Duration Analytics ("How much time is taking at every stage") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Stage Turnaround &amp; Time Spent Analysis
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Measured across recorded stage timestamps
          </span>
        </div>

        {/* Stage Velocity & Bottleneck Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Article Pipeline Turnaround */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Article Cycle Times
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                {stageDurations.totalArticleTime.sampleCount} recorded
              </span>
            </div>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Ideation → Drafted:</span>
                <span className="font-semibold text-foreground">{stageDurations.ideationToDraft.formattedAvg}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Drafted → Published:</span>
                <span className="font-semibold text-foreground">{stageDurations.draftToPublish.formattedAvg}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-medium text-foreground">Total Article Lead Time:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {stageDurations.totalArticleTime.formattedAvg}
                </span>
              </div>
            </div>
          </div>

          {/* Video Pipeline Turnaround */}
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.03] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Video Cycle Times
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-medium">
                {stageDurations.totalVideoTime.sampleCount} recorded
              </span>
            </div>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Film className="w-3 h-3 text-rose-500" /> Ideation → Shot:
                </span>
                <span className="font-semibold text-foreground">{stageDurations.ideationToShooting.formattedAvg}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-rose-500" /> Shot → Edited:
                </span>
                <span className="font-semibold text-foreground">{stageDurations.shootingToEditing.formattedAvg}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3 h-3 text-rose-500" /> Edited → Uploaded:
                </span>
                <span className="font-semibold text-foreground">{stageDurations.editingToUpload.formattedAvg}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-medium text-foreground">Total Video Lead Time:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                  {stageDurations.totalVideoTime.formattedAvg}
                </span>
              </div>
            </div>
          </div>

          {/* Bottleneck & Velocity Highlights */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Production Velocity &amp; Bottlenecks
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Identify which stage is slowing down output
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Primary Bottleneck (Slowest Stage)
                </span>
                <p className="font-semibold text-foreground mt-0.5">
                  {stageDurations.slowestStage ? stageDurations.slowestStage.stageName : 'Not enough timestamp data yet'}
                </p>
                {stageDurations.slowestStage && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Takes avg {stageDurations.slowestStage.formattedAvg}
                  </p>
                )}
              </div>

              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                  Fastest Transition Stage
                </span>
                <p className="font-semibold text-foreground mt-0.5">
                  {stageDurations.fastestStage ? stageDurations.fastestStage.stageName : 'Not enough timestamp data yet'}
                </p>
                {stageDurations.fastestStage && (
                  <p className="text-[11px] text-primary font-medium">
                    Takes avg {stageDurations.fastestStage.formattedAvg}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stage Duration Comparison Chart */}
        <Card className="rounded-2xl border-border/75">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Average Turnaround Time per Production Stage (Hours)</CardTitle>
            <CardDescription className="text-xs">
              Comparing average duration in hours from start to completion across each stage
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDurationChartData} margin={{ top: 12, right: 16, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={gridStroke} 
                  tick={axisStyle}
                  interval={0}
                  tickFormatter={(val) => {
                    if (val.length > 18) return val.slice(0, 16) + '...';
                    return val;
                  }}
                />
                <YAxis tick={axisStyle} stroke={gridStroke} unit="h" />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} hrs (${item.payload.formatted})`,
                    'Average Duration'
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Bar 
                  dataKey="avgHours" 
                  name="Average Time (Hours)" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {stageDurationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Conversion Funnel & Transition Breakdown ("How many got converted, how many did not") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Idea Conversion &amp; Drop-off Funnel
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Tracking how ideas convert from one phase to the next
          </span>
        </div>

        {/* Visual Step-by-Step Conversion Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {funnelSteps.map((step, idx) => (
            <div 
              key={step.name} 
              className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs relative overflow-hidden space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{step.name}</span>
                <span 
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${step.color}20`, color: step.color }}
                >
                  {step.percentageOfTotal.toFixed(0)}% of total
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{step.count}</span>
                <span className="text-[11px] text-muted-foreground">ideas</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${step.percentageOfTotal}%`, backgroundColor: step.color }} 
                />
              </div>

              {/* Drop-off / Conversion Note */}
              <div className="text-[11px] pt-1 flex items-center justify-between">
                {idx === 0 ? (
                  <span className="text-muted-foreground">{step.description}</span>
                ) : (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {step.conversionRateFromPrev.toFixed(0)}% converted
                    </span>
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3 text-amber-500" /> {step.dropOffCount} dropped ({step.dropOffRate.toFixed(0)}%)
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Converted vs Not Converted Detail Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transition 1: Ideation -> Research Conversion */}
          <Card className="rounded-xl border-border/75">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Phase 1: Ideation → Research Conversion</span>
                <span className="text-xs font-normal text-muted-foreground">{totalIdeas} ideas</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Did the idea receive initial research or remain unresearched?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Converted to Researched ({researched.count})
                  </span>
                  <span className="font-semibold text-foreground">{researched.rate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${researched.rate}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5" /> Awaiting Research / Not Converted ({researched.unresearchedCount})
                  </span>
                  <span className="font-semibold text-foreground">{researched.unresearchedRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${researched.unresearchedRate}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Research Conversion Ratio:</span>
                <span className="font-semibold text-foreground">{researched.count} of {totalIdeas} ideas researched</span>
              </div>
            </CardContent>
          </Card>

          {/* Transition 2: Research -> Formats Conversion */}
          <Card className="rounded-xl border-border/75">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Phase 2: Research → Formats Conversion</span>
                <span className="text-xs font-normal text-muted-foreground">{researched.count} researched</span>
              </CardTitle>
              <CardDescription className="text-xs">
                How many researched ideas converted to Articles, Videos, or Both?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <p className="text-[10px] uppercase font-semibold text-emerald-600">Articles Converted</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formats.articles}</p>
                  <p className="text-[10px] text-muted-foreground">{formats.articleRate.toFixed(0)}% of researched</p>
                </div>

                <div className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/5">
                  <p className="text-[10px] uppercase font-semibold text-rose-600">Videos Converted</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formats.videos}</p>
                  <p className="text-[10px] text-muted-foreground">{formats.videoRate.toFixed(0)}% of researched</p>
                </div>

                <div className="p-2 rounded-lg border border-violet-500/30 bg-violet-500/5">
                  <p className="text-[10px] uppercase font-semibold text-violet-600">Both (Dual Channel)</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formats.both}</p>
                  <p className="text-[10px] text-muted-foreground">High-leverage ideas</p>
                </div>

                <div className="p-2 rounded-lg border border-border/60 bg-muted/20">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Research Only (No format)</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formats.neither}</p>
                  <p className="text-[10px] text-muted-foreground">{formats.neitherRate.toFixed(0)}% not converted yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Production Sub-Stage Pipeline (Shooting, Editing, Uploaded, Drafted, Published) */}
      <Card className="rounded-2xl border-border/75">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Active Production Milestones &amp; Sub-Stage Pipelines
          </CardTitle>
          <CardDescription className="text-xs">
            Tracking individual completion milestones from script drafting to final live publication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Sub-stages Pipeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-500 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Video Pipeline (Shooting → Editing → Uploaded)
              </span>
              <span className="text-muted-foreground text-[11px]">
                {videoPipeline.uploaded} of {videoPipeline.total} uploaded ({videoPipeline.uploadRate.toFixed(0)}%)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl border border-border/70 bg-card">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">1. Script Drafted</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{videoPipeline.scripted}</p>
                <p className="text-[10px] text-muted-foreground">scripts ready</p>
              </div>
              <div className="p-2.5 rounded-xl border border-border/70 bg-card">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                  <Film className="w-3 h-3 text-rose-500" /> 2. Shooting Done
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5">{videoPipeline.shot}</p>
                <p className="text-[10px] text-muted-foreground">footage recorded</p>
              </div>
              <div className="p-2.5 rounded-xl border border-border/70 bg-card">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-rose-500" /> 3. Editing Done
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5">{videoPipeline.edited}</p>
                <p className="text-[10px] text-muted-foreground">cut &amp; rendered</p>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> 4. Uploaded ✓
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{videoPipeline.uploaded}</p>
                <p className="text-[10px] text-muted-foreground">live on YouTube/Instagram</p>
              </div>
            </div>
          </div>

          {/* Article Sub-stages Pipeline */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Article Pipeline (Drafted → Published)
              </span>
              <span className="text-muted-foreground text-[11px]">
                {articlePipeline.published} of {articlePipeline.total} published ({articlePipeline.publishRate.toFixed(0)}%)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl border border-border/70 bg-card">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">1. Drafted</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{articlePipeline.drafted}</p>
                <p className="text-[10px] text-muted-foreground">articles drafted &amp; reviewed</p>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 2. Published ✓
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{articlePipeline.published}</p>
                <p className="text-[10px] text-muted-foreground">live on Medium/Substack</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
