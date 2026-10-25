import { FileText, Video, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Idea } from '@/types';
import { getIdeaPublishStatus } from '@/utils/ideaStatus';
import { cn } from 'cn';

interface IdeaBannerProps {
  idea: Idea;
  isArticleSelected: boolean;
  isVideoSelected: boolean;
  onCopyTitle: (title: string) => void;
}

export function IdeaBanner({
  idea,
  isArticleSelected,
  isVideoSelected,
  onCopyTitle,
}: IdeaBannerProps) {
  const publishStatus = getIdeaPublishStatus(idea);

  return (
    <div className="relative overflow-hidden w-full min-w-0 rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-all">
      {publishStatus && (
        <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', publishStatus.accentGradient)} />
      )}

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {publishStatus && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider',
                publishStatus.badgeClass
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', publishStatus.dotClass)} />
              <span>{publishStatus.label}</span>
            </div>
          )}

          {/* Active format badges */}
          {isArticleSelected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              <FileText className="w-3 h-3" /> Article
            </span>
          )}
          {isVideoSelected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/25">
              <Video className="w-3 h-3" /> Video
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70 hover:border-border hover:bg-muted/60 transition-colors shrink-0 cursor-pointer"
          onClick={() => onCopyTitle(idea.idea)}
          title="Copy idea title"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Copy Title</span>
        </Button>
      </div>

      {/* Idea Title */}
      <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground break-words [overflow-wrap:anywhere] leading-snug sm:leading-relaxed">
        {idea.idea}
      </h1>
    </div>
  );
}
