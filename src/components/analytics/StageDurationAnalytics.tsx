import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Clock, FileText, Video, Film, Scissors, Upload, Zap 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ConversionAnalytics } from '@/types';

interface StageDurationAnalyticsProps {
  stageDurations: ConversionAnalytics['stageDurations'];
}

export function StageDurationAnalytics({ stageDurations }: StageDurationAnalyticsProps) {
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

  const stageDurationChartData = useMemo(() => {
    return stageDurations.chartStages.map((s) => ({
      name: s.stageName,
      avgHours: Number(s.avgHours.toFixed(1)),
      avgDays: Number(s.avgDays.toFixed(1)),
      samples: s.sampleCount,
      formatted: s.formattedAvg,
      color: s.color,
    }));
  }, [stageDurations.chartStages]);

  return (
    <div className="space-y-3">
      {/* Section Header */}
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
                formatter={(val: any, _name: any, item: any) => [
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
  );
}
