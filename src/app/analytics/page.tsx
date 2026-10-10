'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, FileText, Target, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';

const PIE_COLORS = ['#8b5cf6', '#f59e0b', '#10b981'];

export default function AnalyticsDashboard() {
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
    
    const platformCounts = { 'X': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };
    const ineligibleCounts = { 'X': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };
    const pendingCounts = { 'X': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };

    ideas.forEach(idea => {
      const isX = idea.publishedX || idea.status === 'posted';
      if (isX) platformCounts['X']++;
      if (idea.publishedMedium) platformCounts['Medium']++;
      if (idea.publishedSubstack) platformCounts['Substack']++;
      if (idea.publishedYoutube) platformCounts['YouTube']++;
      if (idea.publishedInstagram) platformCounts['Instagram']++;

      if (idea.ineligibleX) ineligibleCounts['X']++;
      if (idea.ineligibleMedium) ineligibleCounts['Medium']++;
      if (idea.ineligibleSubstack) ineligibleCounts['Substack']++;
      if (idea.ineligibleYoutube) ineligibleCounts['YouTube']++;
      if (idea.ineligibleInstagram) ineligibleCounts['Instagram']++;

      if ((idea.eligibleX || !idea.ineligibleX) && !isX) pendingCounts['X']++;
      if (idea.eligibleMedium && !idea.publishedMedium) pendingCounts['Medium']++;
      if (idea.eligibleSubstack && !idea.publishedSubstack) pendingCounts['Substack']++;
      if (idea.eligibleYoutube && !idea.publishedYoutube) pendingCounts['YouTube']++;
      if (idea.eligibleInstagram && !idea.publishedInstagram) pendingCounts['Instagram']++;

      const totalPlatforms = [
        isX || idea.ineligibleX, 
        idea.publishedMedium || idea.ineligibleMedium, 
        idea.publishedSubstack || idea.ineligibleSubstack, 
        idea.publishedYoutube || idea.ineligibleYoutube, 
        idea.publishedInstagram || idea.ineligibleInstagram
      ].filter(Boolean).length;
      
      if (totalPlatforms === 0) totallyUnpublished++;
      if (totalPlatforms === 5) fullyPublished++;
    });

    const activeIdeas = totalIdeas - totallyUnpublished;
    const completionRate = totalIdeas > 0 ? ((fullyPublished / totalIdeas) * 100).toFixed(1) : '0';

    const barChartData = Object.keys(platformCounts).map((name) => ({ 
      name, 
      Published: platformCounts[name as keyof typeof platformCounts],
      Pending: pendingCounts[name as keyof typeof pendingCounts],
      Skipped: ineligibleCounts[name as keyof typeof ineligibleCounts],
    }));

    const pieChartData = [
      { name: 'Unpublished', value: totallyUnpublished },
      { name: 'In Progress', value: activeIdeas - fullyPublished },
      { name: 'Completed', value: fullyPublished },
    ];

    const sortedIdeas = [...ideas].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const sortedDatesMap = new Map<string, number>();
    sortedIdeas.forEach(idea => {
      const dateObj = new Date(idea.createdAt);
      if (!isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        sortedDatesMap.set(dateStr, (sortedDatesMap.get(dateStr) || 0) + 1);
      }
    });
    
    const timelineData = Array.from(sortedDatesMap.entries()).map(([date, count]) => ({
      date,
      ideas: count
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
    { label: 'Active', value: activeIdeas, sub: 'on at least 1 platform', icon: TrendingUp },
    { label: 'Completed', value: fullyPublished, sub: 'all platforms done', icon: CheckCircle },
    { label: 'Completion', value: `${completionRate}%`, sub: 'omnipresent rate', icon: Target },
  ];

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Distribution</CardTitle>
            <CardDescription className="text-xs">Published, pending, and skipped per platform</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} stroke={gridStroke} />
                <YAxis tick={axisStyle} stroke={gridStroke} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'var(--muted)' }} contentStyle={tooltipStyle} />
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
            <CardTitle className="text-sm font-medium">Idea Creation Timeline</CardTitle>
            <CardDescription className="text-xs">Content generation over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} stroke={gridStroke} />
                <YAxis tick={axisStyle} stroke={gridStroke} allowDecimals={false} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ideas" stroke="var(--primary)" fillOpacity={1} fill="url(#colorIdeas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
