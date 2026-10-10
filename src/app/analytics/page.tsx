'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, FileText, BarChart3, Target, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981'];

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
    
    let platformCounts = { 'X (Twitter)': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };
    let ineligibleCounts = { 'X (Twitter)': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };
    let pendingCounts = { 'X (Twitter)': 0, 'Medium': 0, 'Substack': 0, 'YouTube': 0, 'Instagram': 0 };

    ideas.forEach(idea => {
      // Platform Stats
      const isX = idea.publishedX || idea.status === 'posted';
      if (isX) platformCounts['X (Twitter)']++;
      if (idea.publishedMedium) platformCounts['Medium']++;
      if (idea.publishedSubstack) platformCounts['Substack']++;
      if (idea.publishedYoutube) platformCounts['YouTube']++;
      if (idea.publishedInstagram) platformCounts['Instagram']++;

      if (idea.ineligibleX) ineligibleCounts['X (Twitter)']++;
      if (idea.ineligibleMedium) ineligibleCounts['Medium']++;
      if (idea.ineligibleSubstack) ineligibleCounts['Substack']++;
      if (idea.ineligibleYoutube) ineligibleCounts['YouTube']++;
      if (idea.ineligibleInstagram) ineligibleCounts['Instagram']++;

      if ((idea.eligibleX || !idea.ineligibleX) && !isX) pendingCounts['X (Twitter)']++;
      if (idea.eligibleMedium && !idea.publishedMedium) pendingCounts['Medium']++;
      if (idea.eligibleSubstack && !idea.publishedSubstack) pendingCounts['Substack']++;
      if (idea.eligibleYoutube && !idea.publishedYoutube) pendingCounts['YouTube']++;
      if (idea.eligibleInstagram && !idea.publishedInstagram) pendingCounts['Instagram']++;

      // Completion Logic
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
      { name: 'Unpublished / New', value: totallyUnpublished },
      { name: 'In Progress', value: activeIdeas - fullyPublished },
      { name: 'Fully Completed', value: fullyPublished },
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
      totalIdeas, activeIdeas, fullyPublished, totallyUnpublished, completionRate, barChartData, pieChartData, timelineData
    };
  }, [ideas]);

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <p className="text-red-500 text-lg">Error loading analytics: {error}</p>
      </div>
    );
  }

  if (loading || !hasFetched) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center mt-12">
        <p className="text-muted-foreground text-lg">Not enough data to show analytics.</p>
      </div>
    );
  }

  const { totalIdeas, activeIdeas, fullyPublished, completionRate, barChartData, pieChartData, timelineData } = analyticsData;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary flex items-center">
          <BarChart3 className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" /> Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Ideas Generated</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalIdeas}</div>
            <p className="text-xs text-muted-foreground mt-1">across all time</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Ideas</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeIdeas}</div>
            <p className="text-xs text-muted-foreground mt-1">published on at least 1 platform</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Omnipresent Ideas</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{fullyPublished}</div>
            <p className="text-xs text-muted-foreground mt-1">completed all platforms</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">of all ideas are omnipresent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Status of content per platform</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                <YAxis stroke="#888" tick={{fill: '#888'}} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{fill: '#222'}} 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Published" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Skipped" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.5} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle>Overall Idea Status</CardTitle>
            <CardDescription>Breakdown of how far along your ideas are</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} 
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Idea Creation Timeline</CardTitle>
            <CardDescription>Trend of your content generation over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" tick={{fill: '#888'}} />
                <YAxis stroke="#888" tick={{fill: '#888'}} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} 
                />
                <Area type="monotone" dataKey="ideas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorIdeas)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
