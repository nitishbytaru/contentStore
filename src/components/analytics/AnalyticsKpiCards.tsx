import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, BookOpen, FileText, Video, Layers, Hourglass } from 'lucide-react';
import { ConversionAnalytics } from '@/types';

interface AnalyticsKpiCardsProps {
  totalIdeas: number;
  researched: ConversionAnalytics['researched'];
  articlePipeline: ConversionAnalytics['articlePipeline'];
  videoPipeline: ConversionAnalytics['videoPipeline'];
  formats: ConversionAnalytics['formats'];
}

export function AnalyticsKpiCards({
  totalIdeas,
  researched,
  articlePipeline,
  videoPipeline,
  formats,
}: AnalyticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Ideas */}
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

      {/* 2. Ideas Researched */}
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

      {/* 3. Articles Created */}
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

      {/* 4. Videos Created */}
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

      {/* 5. Dual Formats */}
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

      {/* 6. Unresearched / Pending */}
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
  );
}
