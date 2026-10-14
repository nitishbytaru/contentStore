'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, FileText, Target, AlertCircle, Bell, Video, Calendar, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';
import { cn } from 'cn';
import { calculateCadence } from '@/lib/cadence';

const PIE_COLORS = ['#8b5cf6', '#f59e0b', '#10b981'];

export function AnalyticsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: ideas, loading, error, hasFetched } = useSelector((state: RootState) => state.ideas);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchIdeas());
    }
  }, [dispatch, hasFetched]);

  const analyticsData = useMemo(() => {
    if (!ideas.length) return null;

    const totalIdeas = ideas.length;
    let totallyUnpublished = 0;
    let fullyPublished = 0;
    
    const channelCounts = {
      'X': { published: 0, skipped: 0, pending: 0 },
      'Articles': { published: 0, skipped: 0, pending: 0 },
      'Videos': { published: 0, skipped: 0, pending: 0 },
    };

    ideas.forEach(idea => {
      // Channel 1: X (Twitter)
      const isXPublished = Boolean(idea.publishedX || idea.status === 'posted');
      const isXSkipped = !isXPublished && Boolean(idea.ineligibleX);
      const isXPending = !isXPublished && !isXSkipped;

      if (isXPublished) channelCounts['X'].published++;
      else if (isXSkipped) channelCounts['X'].skipped++;
      else if (isXPending) channelCounts['X'].pending++;

      // Channel 2: Articles (Medium & Substack)
      const isArticlesPublished = Boolean(idea.publishedMedium || idea.publishedSubstack);
      const isArticlesSkipped = !isArticlesPublished && Boolean(idea.ineligibleMedium || idea.ineligibleSubstack);
      const isArticlesPending = !isArticlesPublished && !isArticlesSkipped && Boolean(idea.eligibleMedium || idea.eligibleSubstack);

      if (isArticlesPublished) channelCounts['Articles'].published++;
      else if (isArticlesSkipped) channelCounts['Articles'].skipped++;
      else if (isArticlesPending) channelCounts['Articles'].pending++;

      // Channel 3: Videos (YouTube & Instagram)
      const isVideosPublished = Boolean(idea.publishedYoutube || idea.publishedInstagram);
      const isVideosSkipped = !isVideosPublished && Boolean(idea.ineligibleYoutube || idea.ineligibleInstagram);
      const isVideosPending = !isVideosPublished && !isVideosSkipped && Boolean(idea.eligibleYoutube || idea.eligibleInstagram);

      if (isVideosPublished) channelCounts['Videos'].published++;
      else if (isVideosSkipped) channelCounts['Videos'].skipped++;
      else if (isVideosPending) channelCounts['Videos'].pending++;

      // Completion calculation across 3 merged channels
      const isXDone = isXPublished || isXSkipped;
      const isArticlesDone = isArticlesPublished || isArticlesSkipped;
      const isVideosDone = isVideosPublished || isVideosSkipped;

      const channelsDone = [isXDone, isArticlesDone, isVideosDone].filter(Boolean).length;
      if (channelsDone === 0) totallyUnpublished++;
      if (channelsDone === 3) fullyPublished++;
    });

    const activeIdeas = totalIdeas - totallyUnpublished;
    const completionRate = totalIdeas > 0 ? ((fullyPublished / totalIdeas) * 100).toFixed(1) : '0';

    const barChartData = [
      { 
        name: 'X', 
        fullName: 'X (Twitter)',
        subtitle: 'Twitter',
        Published: channelCounts['X'].published,
        Pending: channelCounts['X'].pending,
        Skipped: channelCounts['X'].skipped,
      },
      { 
        name: 'Articles', 
        fullName: 'Articles (Medium & Substack)',
        subtitle: 'Medium & Substack',
        Published: channelCounts['Articles'].published,
        Pending: channelCounts['Articles'].pending,
        Skipped: channelCounts['Articles'].skipped,
      },
      { 
        name: 'Videos', 
        fullName: 'Videos (YouTube & Instagram)',
        subtitle: 'YouTube & Instagram',
        Published: channelCounts['Videos'].published,
        Pending: channelCounts['Videos'].pending,
        Skipped: channelCounts['Videos'].skipped,
      },
    ];

    const pieChartData = [
      { name: 'Unpublished', value: totallyUnpublished },
      { name: 'In Progress', value: Math.max(0, activeIdeas - fullyPublished) },
      { name: 'Completed', value: fullyPublished },
    ];

    const sortedIdeas = [...ideas].sort((a, b) => {
      const timeA = new Date(a.datePosted || a.createdAt).getTime();
      const timeB = new Date(b.datePosted || b.createdAt).getTime();
      return timeA - timeB;
    });

    const sortedDatesMap = new Map<string, { medium: number; youtube: number }>();
    sortedIdeas.forEach(idea => {
      const rawDate = idea.datePosted || idea.createdAt;
      const dateObj = new Date(rawDate);
      if (!isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const current = sortedDatesMap.get(dateStr) || { medium: 0, youtube: 0 };
        if (idea.publishedMedium || idea.publishedSubstack) {
          current.medium++;
        }
        if (idea.publishedYoutube || idea.publishedInstagram) {
          current.youtube++;
        }
        sortedDatesMap.set(dateStr, current);
      }
    });
    
    const timelineData = Array.from(sortedDatesMap.entries()).map(([date, counts]) => ({
      date,
      'Medium Posts': counts.medium,
      'YouTube Posts': counts.youtube,
    }));

    return {
      totalIdeas, activeIdeas, fullyPublished, completionRate, barChartData, pieChartData, timelineData
    };
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
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
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

  if (!analyticsData) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Not enough data to show analytics.</p>
      </div>
    );
  }

  const { totalIdeas, activeIdeas, fullyPublished, completionRate, barChartData, pieChartData, timelineData } = analyticsData;
  const cadence = useMemo(() => calculateCadence(ideas), [ideas]);

  const tooltipStyle = { 
    backgroundColor: 'var(--card)', 
    borderColor: 'var(--border)', 
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--card-foreground)'
  };
  const axisStyle = { fill: 'var(--muted-foreground)', fontSize: 11 };
  const gridStroke = 'var(--border)';

  const metricCards = [
    { label: 'Total Ideas', value: totalIdeas, sub: 'across all time', icon: FileText },
    { label: 'Active', value: activeIdeas, sub: 'on at least 1 channel', icon: TrendingUp },
    { label: 'Completed', value: fullyPublished, sub: 'all channels done', icon: CheckCircle },
    { label: 'Completion', value: `${completionRate}%`, sub: 'omnipresent rate', icon: Target },
  ];

  const renderPlatformAxisTick = ({ x, y, payload }: { x?: string | number; y?: string | number; payload?: { value?: string } }) => {
    if (!payload?.value) return null;
    const item = barChartData.find(d => d.name === payload.value);
    return (
      <g transform={`translate(${x ?? 0},${y ?? 0})`}>
        <text x={0} y={0} dy={14} textAnchor="middle" fill="var(--card-foreground)" fontSize={11} fontWeight={500}>
          {payload.value}
        </text>
        {item?.subtitle && (
          <text x={0} y={0} dy={27} textAnchor="middle" fill="var(--muted-foreground)" fontSize={9}>
            {item.subtitle}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Publishing Cadence & Reminders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Publishing Cadence & Reminders</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Goals: 1 article / 3 days • 1 video / 7 days
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Article Cadence Card */}
          <Card className={cn(
            "border-l-4 transition-all shadow-xs",
            cadence.article.status === 'overdue' || cadence.article.status === 'no-posts'
              ? "border-l-rose-500 bg-rose-500/[0.02]"
              : cadence.article.status === 'due-today'
              ? "border-l-amber-500 bg-amber-500/[0.02]"
              : "border-l-emerald-500 bg-emerald-500/[0.02]"
          )}>
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Article Publishing</h3>
                    <p className="text-xs text-muted-foreground">Target: 1 article every 3 days</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0",
                  cadence.article.status === 'overdue' || cadence.article.status === 'no-posts'
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                    : cadence.article.status === 'due-today'
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                )}>
                  {cadence.article.statusLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cycle progress</span>
                  <span className="font-medium text-foreground">
                    {cadence.article.daysSinceLast !== null 
                      ? `${cadence.article.daysSinceLast} / 3 days elapsed`
                      : 'No posts yet'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      cadence.article.status === 'overdue' || cadence.article.status === 'no-posts'
                        ? "bg-rose-500"
                        : cadence.article.status === 'due-today'
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${cadence.article.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Meta Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>
                  Last published: {cadence.article.lastPublishedDate 
                    ? cadence.article.lastPublishedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'None yet'}
                </span>
                <span>Total: {cadence.article.totalPublished} published</span>
              </div>
            </CardContent>
          </Card>

          {/* Video Cadence Card */}
          <Card className={cn(
            "border-l-4 transition-all shadow-xs",
            cadence.video.status === 'overdue' || cadence.video.status === 'no-posts'
              ? "border-l-rose-500 bg-rose-500/[0.02]"
              : cadence.video.status === 'due-today'
              ? "border-l-amber-500 bg-amber-500/[0.02]"
              : "border-l-emerald-500 bg-emerald-500/[0.02]"
          )}>
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Video Publishing</h3>
                    <p className="text-xs text-muted-foreground">Target: 1 video every 7 days</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0",
                  cadence.video.status === 'overdue' || cadence.video.status === 'no-posts'
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                    : cadence.video.status === 'due-today'
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                )}>
                  {cadence.video.statusLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cycle progress</span>
                  <span className="font-medium text-foreground">
                    {cadence.video.daysSinceLast !== null 
                      ? `${cadence.video.daysSinceLast} / 7 days elapsed`
                      : 'No posts yet'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      cadence.video.status === 'overdue' || cadence.video.status === 'no-posts'
                        ? "bg-rose-500"
                        : cadence.video.status === 'due-today'
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${cadence.video.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Meta Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>
                  Last published: {cadence.video.lastPublishedDate 
                    ? cadence.video.lastPublishedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'None yet'}
                </span>
                <span>Total: {cadence.video.totalPublished} published</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Distribution</CardTitle>
            <CardDescription className="text-xs">Published, pending, and skipped across X, Articles, and Videos</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} maxBarSize={52} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" stroke={gridStroke} height={36} tick={renderPlatformAxisTick} />
                <YAxis tick={axisStyle} stroke={gridStroke} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }} 
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => {
                    const item = barChartData.find(d => d.name === label);
                    return item ? item.fullName : label;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Published" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="Skipped" fill="var(--destructive)" radius={[3, 3, 0, 0]} opacity={0.5} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idea Status</CardTitle>
            <CardDescription className="text-xs">Overall progress breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published Posts Timeline</CardTitle>
            <CardDescription className="text-xs">Medium and YouTube posts over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorYoutube" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} stroke={gridStroke} />
                <YAxis tick={axisStyle} stroke={gridStroke} allowDecimals={false} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area 
                  type="monotone" 
                  dataKey="Medium Posts" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMedium)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="YouTube Posts" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorYoutube)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
