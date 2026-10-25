import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, CheckCircle, Hourglass, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { ConversionAnalytics } from '@/types';

interface ConversionFunnelProps {
  totalIdeas: number;
  researched: ConversionAnalytics['researched'];
  formats: ConversionAnalytics['formats'];
  funnelSteps: ConversionAnalytics['funnelSteps'];
}

export function ConversionFunnel({
  totalIdeas,
  researched,
  formats,
  funnelSteps,
}: ConversionFunnelProps) {
  return (
    <div className="space-y-3">
      {/* Section Header */}
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
  );
}
