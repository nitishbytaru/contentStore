import Link from 'next/link';
import { ArrowLeft, Settings2, Save, Loader2, Check, Copy, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Idea } from '@/types';
import { isIdeaCompleted, canCompleteIdea, getIdeaPublishStatus } from '@/utils/ideaStatus';
import { cn } from 'cn';

interface IdeaEditorHeaderProps {
  idea: Idea;
  saving: boolean;
  isArticleSelected: boolean;
  isVideoSelected: boolean;
  onOpenFormatModal: () => void;
  onSave: () => void;
  onCompleteIdea: () => void;
  onCopyTitle: (title: string) => void;
  locked?: boolean;
}

export function IdeaEditorHeader({
  idea,
  saving,
  isArticleSelected,
  isVideoSelected,
  onOpenFormatModal,
  onSave,
  onCompleteIdea,
  onCopyTitle,
  locked = false,
}: IdeaEditorHeaderProps) {
  const completed = isIdeaCompleted(idea);
  const check = canCompleteIdea(idea);
  const publishStatus = getIdeaPublishStatus(idea);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 w-full min-w-0 min-h-14">
      <Link
        href="/ideas"
        aria-disabled={locked}
        tabIndex={locked ? -1 : undefined}
        className={cn(
          'inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0',
          locked && 'pointer-events-none opacity-50'
        )}
        title="Back to Ideas"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        <span className="hidden sm:inline">Ideas</span>
      </Link>

      <h1 className="min-w-0 flex-1 basis-40 truncate text-sm font-semibold text-foreground" title={idea.idea}>
        {idea.idea}
      </h1>

      <div className="flex items-center gap-1 flex-wrap">
        {publishStatus && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide',
              publishStatus.badgeClass
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', publishStatus.dotClass)} />
            {publishStatus.label}
          </span>
        )}
        {isArticleSelected && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <FileText className="w-3 h-3" /> Article
          </span>
        )}
        {isVideoSelected && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/25">
            <Video className="w-3 h-3" /> Video
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title="Copy title"
          disabled={locked}
          onClick={() => onCopyTitle(idea.idea)}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title="Configure formats"
          disabled={locked}
          onClick={onOpenFormatModal}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs gap-1"
          onClick={onSave}
          disabled={saving || locked}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant={completed || check.allowed ? 'default' : 'outline'}
          className={cn(
            'h-8 px-2.5 text-xs gap-1',
            (completed || check.allowed) && 'bg-emerald-600 hover:bg-emerald-700 text-white'
          )}
          onClick={onCompleteIdea}
          disabled={saving || locked}
          title={completed ? 'Reopen this idea' : check.reason}
        >
          <Check className="w-3.5 h-3.5" />
          {completed ? 'Completed' : 'Complete'}
        </Button>
      </div>
    </div>
  );
}
