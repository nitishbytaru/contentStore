import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers, Video, Film, Scissors, Upload, FileText, CheckCircle } from 'lucide-react';
import { ConversionAnalytics } from '@/types';

interface ProductionMilestonesProps {
  articlePipeline: ConversionAnalytics['articlePipeline'];
  videoPipeline: ConversionAnalytics['videoPipeline'];
}

export function ProductionMilestones({
  articlePipeline,
  videoPipeline,
}: ProductionMilestonesProps) {
  return (
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
  );
}
