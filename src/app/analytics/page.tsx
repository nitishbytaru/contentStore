'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, FileText, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface Idea {
  id: string;
  idea: string;
  status: string;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedX: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
}

const COLORS = ['#8b5cf6', '#d946ef', '#f43f5e', '#0ea5e9', '#10b981'];

export default function AnalyticsDashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const res = await fetch('/api/ideas');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch');
        setIdeas(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <p className="text-red-500 text-lg">Error loading analytics: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Calculate metrics
  const totalIdeas = ideas.length;
  let totallyUnpublished = 0;
  let fullyPublished = 0; // Published on all 5
  
  let platformCounts = {
    'X (Twitter)': 0,
    'Medium': 0,
    'Substack': 0,
    'YouTube': 0,
    'Instagram': 0,
  };

  ideas.forEach(idea => {
    // Treat legacy "posted" as published on X
    const isX = idea.publishedX || idea.status === 'posted';
    if (isX) platformCounts['X (Twitter)']++;
    if (idea.publishedMedium) platformCounts['Medium']++;
    if (idea.publishedSubstack) platformCounts['Substack']++;
    if (idea.publishedYoutube) platformCounts['YouTube']++;
    if (idea.publishedInstagram) platformCounts['Instagram']++;

    const totalPlatforms = [isX, idea.publishedMedium, idea.publishedSubstack, idea.publishedYoutube, idea.publishedInstagram].filter(Boolean).length;
    
    if (totalPlatforms === 0) {
      totallyUnpublished++;
    }
    if (totalPlatforms === 5) {
      fullyPublished++;
    }
  });

  const activeIdeas = totalIdeas - totallyUnpublished;

  const barChartData = Object.entries(platformCounts).map(([name, value]) => ({ name, Published: value }));

  const pieChartData = [
    { name: 'Unpublished', value: totallyUnpublished },
    { name: 'Active/Partially Published', value: activeIdeas - fullyPublished },
    { name: 'Fully Published (All 5)', value: fullyPublished },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
          <BarChart3 className="w-8 h-8 mr-3" /> Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Ideas Generated</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalIdeas}</div>
            <p className="text-xs text-muted-foreground mt-1">across all time</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Ideas</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeIdeas}</div>
            <p className="text-xs text-muted-foreground mt-1">published on at least 1 platform</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Omnipresent Ideas</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{fullyPublished}</div>
            <p className="text-xs text-muted-foreground mt-1">published everywhere (all 5)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Number of articles/posts published per platform</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                <YAxis stroke="#888" tick={{fill: '#888'}} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{fill: '#222'}} 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} 
                />
                <Bar dataKey="Published" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <CardTitle>Idea Completion Status</CardTitle>
            <CardDescription>Breakdown of how far along your ideas are</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
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
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
