'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Lightbulb, 
  FileText, 
  Video, 
  Layers, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  ArrowUpRight, 
  Activity,
  Compass,
  Zap,
  BookmarkCheck
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';

import { useGetIdeasQuery } from '@/store/api/ideasApi';
import { useGetPromptsQuery } from '@/store/api/promptsApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { 
  isIdeaCompleted, 
  isArticleIdea, 
  isVideoIdea, 
  hasIdeaResearch 
} from '@/utils/ideaStatus';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: ideas = [], isLoading: ideasLoading } = useGetIdeasQuery();
  const { data: prompts = [], isLoading: promptsLoading } = useGetPromptsQuery();

  const metrics = useMemo(() => {
    const totalIdeas = ideas.length;
    const completedIdeas = ideas.filter(isIdeaCompleted).length;
    const pendingIdeas = totalIdeas - completedIdeas;
    const completionRate = totalIdeas > 0 ? Math.round((completedIdeas / totalIdeas) * 100) : 0;

    // Formats
    const articleIdeas = ideas.filter(isArticleIdea);
    const videoIdeas = ideas.filter(isVideoIdea);
    const bothIdeas = ideas.filter((i) => isArticleIdea(i) && isVideoIdea(i));
    const articlesOnly = ideas.filter((i) => isArticleIdea(i) && !isVideoIdea(i));
    const videosOnly = ideas.filter((i) => isVideoIdea(i) && !isArticleIdea(i));
    const researchOnly = ideas.filter((i) => !isArticleIdea(i) && !isVideoIdea(i));

    // Content Readiness
    const researchedIdeas = ideas.filter(hasIdeaResearch).length;
    const articleDrafts = ideas.filter((i) => i.mediumArticle && i.mediumArticle.trim().length > 0).length;
    const videoScripts = ideas.filter((i) => i.youtubeScript && i.youtubeScript.trim().length > 0).length;

    // Format Completion
    const completedArticles = articleIdeas.filter(isIdeaCompleted).length;
    const pendingArticles = articleIdeas.length - completedArticles;
    const completedVideos = videoIdeas.filter(isIdeaCompleted).length;
    const pendingVideos = videoIdeas.length - completedVideos;

    // Platform Breakdown
    const mediumCount = ideas.filter((i) => i.eligibleMedium).length;
    const substackCount = ideas.filter((i) => i.eligibleSubstack).length;
    const youtubeCount = ideas.filter((i) => i.eligibleYoutube).length;
    const instagramCount = ideas.filter((i) => i.eligibleInstagram).length;

    return {
      totalIdeas,
      completedIdeas,
      pendingIdeas,
      completionRate,
      articlesCount: articleIdeas.length,
      videosCount: videoIdeas.length,
      bothCount: bothIdeas.length,
      articlesOnlyCount: articlesOnly.length,
      videosOnlyCount: videosOnly.length,
      researchOnlyCount: researchOnly.length,
      researchedIdeas,
      articleDrafts,
      videoScripts,
      completedArticles,
      pendingArticles,
      completedVideos,
      pendingVideos,
      mediumCount,
      substackCount,
      youtubeCount,
      instagramCount,
    };
  }, [ideas]);

  // Chart 1: Format Distribution
  const formatChartData = useMemo(() => {
    return [
      { name: 'Articles Only', value: metrics.articlesOnlyCount, fill: '#3b82f6' },
      { name: 'Videos Only', value: metrics.videosOnlyCount, fill: '#f43f5e' },
      { name: 'Articles & Videos', value: metrics.bothCount, fill: '#8b5cf6' },
      { name: 'Unassigned / Research', value: metrics.researchOnlyCount, fill: '#10b981' },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const formatChartConfig = {
    articles: { label: 'Articles Only', color: '#3b82f6' },
    videos: { label: 'Videos Only', color: '#f43f5e' },
    both: { label: 'Articles & Videos', color: '#8b5cf6' },
    research: { label: 'Research', color: '#10b981' },
  } satisfies ChartConfig;

  // Chart 2: Pipeline Stage Progress
  const pipelineChartData = useMemo(() => {
    return [
      {
        category: 'All Ideas',
        Completed: metrics.completedIdeas,
        Pending: metrics.pendingIdeas,
      },
      {
        category: 'Articles',
        Completed: metrics.completedArticles,
        Pending: metrics.pendingArticles,
      },
      {
        category: 'Videos',
        Completed: metrics.completedVideos,
        Pending: metrics.pendingVideos,
      },
    ];
  }, [metrics]);

  const pipelineChartConfig = {
    Completed: { label: 'Completed', color: '#10b981' },
    Pending: { label: 'In Progress', color: '#3b82f6' },
  } satisfies ChartConfig;

  // Chart 3: Platform Eligibility Distribution
  const platformChartData = useMemo(() => {
    return [
      { platform: 'Medium', count: metrics.mediumCount, fill: '#10b981' },
      { platform: 'Substack', count: metrics.substackCount, fill: '#f97316' },
      { platform: 'YouTube', count: metrics.youtubeCount, fill: '#ef4444' },
      { platform: 'Instagram', count: metrics.instagramCount, fill: '#ec4899' },
    ];
  }, [metrics]);

  const platformChartConfig = {
    count: { label: 'Eligible Ideas', color: '#8b5cf6' },
  } satisfies ChartConfig;

  const isLoading = ideasLoading || promptsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-primary" />
            Content Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time breakdown of your ideas, articles, videos, and multi-channel pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Sync
          </Badge>
          <Link href="/ideas">
            <Badge variant="secondary" className="text-xs px-2.5 py-1 hover:bg-secondary/80 cursor-pointer">
              View Ideas <ArrowUpRight className="h-3 w-3 ml-0.5 inline" />
            </Badge>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Ideas */}
          <Card className="border-border/60 shadow-xs hover:border-primary/40 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Ideas</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Lightbulb className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.totalIdeas}
                </span>
                <span className="text-xs text-muted-foreground">in library</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="text-emerald-500 font-medium">{metrics.completedIdeas} completed</span>
                <span>•</span>
                <span className="text-blue-500 font-medium">{metrics.pendingIdeas} active</span>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card className="border-border/60 shadow-xs hover:border-blue-500/40 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Articles</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.articlesCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  {metrics.totalIdeas > 0
                    ? `${Math.round((metrics.articlesCount / metrics.totalIdeas) * 100)}% of total`
                    : '0%'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="text-foreground font-medium">{metrics.articleDrafts} drafts</span>
                <span>•</span>
                <span className="text-emerald-500 font-medium">{metrics.completedArticles} published</span>
              </div>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="border-border/60 shadow-xs hover:border-rose-500/40 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Videos</span>
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.videosCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  {metrics.totalIdeas > 0
                    ? `${Math.round((metrics.videosCount / metrics.totalIdeas) * 100)}% of total`
                    : '0%'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="text-foreground font-medium">{metrics.videoScripts} scripted</span>
                <span>•</span>
                <span className="text-emerald-500 font-medium">{metrics.completedVideos} published</span>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="border-border/60 shadow-xs hover:border-emerald-500/40 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.completionRate}%
                </span>
                <span className="text-xs text-muted-foreground">shipped</span>
              </div>
              <div className="mt-2.5">
                <Progress value={metrics.completionRate} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/50 bg-card/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Articles & Videos</p>
            <p className="text-base font-semibold text-foreground">{metrics.bothCount} ideas</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Compass className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Researched</p>
            <p className="text-base font-semibold text-foreground">{metrics.researchedIdeas} ideas</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Active Pipeline</p>
            <p className="text-base font-semibold text-foreground">{metrics.pendingIdeas} pending</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/60 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Prompt Library</p>
            <p className="text-base font-semibold text-foreground">{prompts.length} prompts</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Content Format Distribution */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Content Format Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Ideas partitioned by format target
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {metrics.totalIdeas} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !mounted ? (
              <div className="h-[240px] flex items-center justify-center">
                <Skeleton className="h-44 w-44 rounded-full" />
              </div>
            ) : formatChartData.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                <Lightbulb className="h-8 w-8 mb-2 opacity-40" />
                No idea format data available yet.
              </div>
            ) : (
              <div className="space-y-4">
                <ChartContainer config={formatChartConfig} className="h-[200px] w-full mx-auto">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={formatChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      strokeWidth={2}
                    >
                      {formatChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                {/* Legend Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
                    <span className="text-muted-foreground">Articles Only:</span>
                    <span className="font-semibold text-foreground ml-auto">{metrics.articlesOnlyCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shrink-0" />
                    <span className="text-muted-foreground">Videos Only:</span>
                    <span className="font-semibold text-foreground ml-auto">{metrics.videosOnlyCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                    <span className="text-muted-foreground">Both Formats:</span>
                    <span className="font-semibold text-foreground ml-auto">{metrics.bothCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                    <span className="text-muted-foreground">Research:</span>
                    <span className="font-semibold text-foreground ml-auto">{metrics.researchOnlyCount}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Pipeline Stage Progress (Stacked Bar Chart) */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Pipeline Completion Status</CardTitle>
                <CardDescription className="text-xs">
                  Completed vs Active in progress
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {metrics.completionRate}% Done
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !mounted ? (
              <div className="h-[240px] flex items-center justify-center">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : metrics.totalIdeas === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
                <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
                No pipeline progress data available yet.
              </div>
            ) : (
              <div className="space-y-4">
                <ChartContainer config={pipelineChartConfig} className="h-[200px] w-full">
                  <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Pending" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>

                <div className="flex items-center justify-center gap-6 text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                    <span className="text-muted-foreground">Completed / Shipped</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
                    <span className="text-muted-foreground">Active in Progress</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart 3 & Channel Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Eligibility Bar Chart */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Distribution by Publishing Channel</CardTitle>
                <CardDescription className="text-xs">
                  Number of ideas targeted for each platform
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading || !mounted ? (
              <div className="h-[220px] flex items-center justify-center">
                <Skeleton className="h-[180px] w-full" />
              </div>
            ) : (
              <ChartContainer config={platformChartConfig} className="h-[220px] w-full">
                <BarChart data={platformChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="platform" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Content Readiness Funnel */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Production Funnel</CardTitle>
            <CardDescription className="text-xs">
              Maturity across production phases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Step 1: Researched */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Compass className="h-3.5 w-3.5 text-amber-500" /> Research Ready
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.researchedIdeas} / {metrics.totalIdeas}
                </span>
              </div>
              <Progress
                value={metrics.totalIdeas > 0 ? (metrics.researchedIdeas / metrics.totalIdeas) * 100 : 0}
                className="h-1.5"
              />
            </div>

            {/* Step 2: Article Drafts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Article Drafted
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.articleDrafts} / {metrics.articlesCount || 1}
                </span>
              </div>
              <Progress
                value={metrics.articlesCount > 0 ? (metrics.articleDrafts / metrics.articlesCount) * 100 : 0}
                className="h-1.5"
              />
            </div>

            {/* Step 3: Video Scripts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Video className="h-3.5 w-3.5 text-rose-500" /> Video Scripted
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.videoScripts} / {metrics.videosCount || 1}
                </span>
              </div>
              <Progress
                value={metrics.videosCount > 0 ? (metrics.videoScripts / metrics.videosCount) * 100 : 0}
                className="h-1.5"
              />
            </div>

            {/* Step 4: Fully Shipped */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Fully Completed
                </span>
                <span className="text-muted-foreground font-mono">
                  {metrics.completedIdeas} / {metrics.totalIdeas}
                </span>
              </div>
              <Progress
                value={metrics.completionRate}
                className="h-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table: Format Breakdown */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Format Breakdown Summary</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive overview of your content assets by format
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-4">Content Type</th>
                <th className="py-2.5 px-4">Total Ideas</th>
                <th className="py-2.5 px-4">In Progress</th>
                <th className="py-2.5 px-4">Completed</th>
                <th className="py-2.5 px-4">Completion %</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {/* Articles Row */}
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Articles (Medium / Substack)</span>
                </td>
                <td className="py-3 px-4 font-mono font-medium">{metrics.articlesCount}</td>
                <td className="py-3 px-4 font-mono text-blue-500">{metrics.pendingArticles}</td>
                <td className="py-3 px-4 font-mono text-emerald-500">{metrics.completedArticles}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] w-9">
                      {metrics.articlesCount > 0
                        ? `${Math.round((metrics.completedArticles / metrics.articlesCount) * 100)}%`
                        : '0%'}
                    </span>
                    <Progress
                      value={metrics.articlesCount > 0 ? (metrics.completedArticles / metrics.articlesCount) * 100 : 0}
                      className="h-1.5 w-20"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href="/ideas" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    Filter <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>

              {/* Videos Row */}
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium flex items-center gap-2">
                  <Video className="h-4 w-4 text-rose-500" />
                  <span>Videos (YouTube / Instagram)</span>
                </td>
                <td className="py-3 px-4 font-mono font-medium">{metrics.videosCount}</td>
                <td className="py-3 px-4 font-mono text-rose-500">{metrics.pendingVideos}</td>
                <td className="py-3 px-4 font-mono text-emerald-500">{metrics.completedVideos}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] w-9">
                      {metrics.videosCount > 0
                        ? `${Math.round((metrics.completedVideos / metrics.videosCount) * 100)}%`
                        : '0%'}
                    </span>
                    <Progress
                      value={metrics.videosCount > 0 ? (metrics.completedVideos / metrics.videosCount) * 100 : 0}
                      className="h-1.5 w-20"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href="/ideas" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    Filter <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>

              {/* Dual Formats Row */}
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span>Dual Pipeline (Both Formats)</span>
                </td>
                <td className="py-3 px-4 font-mono font-medium">{metrics.bothCount}</td>
                <td className="py-3 px-4 font-mono text-purple-500">
                  {ideas.filter((i) => isArticleIdea(i) && isVideoIdea(i) && !isIdeaCompleted(i)).length}
                </td>
                <td className="py-3 px-4 font-mono text-emerald-500">
                  {ideas.filter((i) => isArticleIdea(i) && isVideoIdea(i) && isIdeaCompleted(i)).length}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] w-9">
                      {metrics.bothCount > 0
                        ? `${Math.round(
                            (ideas.filter((i) => isArticleIdea(i) && isVideoIdea(i) && isIdeaCompleted(i)).length /
                              metrics.bothCount) *
                              100
                          )}%`
                        : '0%'}
                    </span>
                    <Progress
                      value={
                        metrics.bothCount > 0
                          ? (ideas.filter((i) => isArticleIdea(i) && isVideoIdea(i) && isIdeaCompleted(i)).length /
                              metrics.bothCount) *
                            100
                          : 0
                      }
                      className="h-1.5 w-20"
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href="/ideas" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    Filter <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>

              {/* Total Summary Row */}
              <tr className="bg-muted/30 font-semibold text-foreground">
                <td className="py-3 px-4 flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                  <span>Overall Total</span>
                </td>
                <td className="py-3 px-4 font-mono">{metrics.totalIdeas}</td>
                <td className="py-3 px-4 font-mono text-blue-500">{metrics.pendingIdeas}</td>
                <td className="py-3 px-4 font-mono text-emerald-500">{metrics.completedIdeas}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] w-9">{metrics.completionRate}%</span>
                    <Progress value={metrics.completionRate} className="h-1.5 w-20" />
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href="/ideas" className="text-primary hover:underline inline-flex items-center gap-1">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
