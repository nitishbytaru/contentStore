import Link from 'next/link';
import { ArrowLeft, Settings2, Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Idea } from '@/types';
import { isIdeaCompleted, canCompleteIdea } from '@/utils/ideaStatus';

interface IdeaEditorHeaderProps {
  idea: Idea;
  saving: boolean;
  onOpenFormatModal: () => void;
  onSave: () => void;
  onCompleteIdea: () => void;
}

export function IdeaEditorHeader({
  idea,
  saving,
  onOpenFormatModal,
  onSave,
  onCompleteIdea,
}: IdeaEditorHeaderProps) {
  const completed = isIdeaCompleted(idea);
  const check = canCompleteIdea(idea);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
      <Link
        href="/ideas"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Ideas
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Formats settings button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenFormatModal}
          className="h-9 px-2.5 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground border-border/80 cursor-pointer"
          title="Configure Article and Video tabs"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Configure Formats</span>
        </Button>

        <Button
          onClick={onSave}
          disabled={saving}
          variant="outline"
          className="h-9 px-3.5 text-xs font-medium gap-1.5 border-border/80 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save</span>
        </Button>

        {/* Top Right Completed Button */}
        {completed ? (
          <Button
            type="button"
            onClick={onCompleteIdea}
            disabled={saving}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
            title="Idea is completed! Click if you want to reopen it"
          >
            <Check className="w-4 h-4" />
            <span>Completed ✓</span>
          </Button>
        ) : check.allowed ? (
          <Button
            type="button"
            onClick={onCompleteIdea}
            disabled={saving}
            className="h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse hover:animate-none cursor-pointer"
            title="All required formats are published! Click to finalize as Completed"
          >
            <Check className="w-4 h-4" />
            <span>Complete Idea</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onCompleteIdea}
            disabled={saving}
            variant="outline"
            className="h-9 px-3.5 text-xs font-medium gap-1.5 border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
            title={check.reason}
          >
            <Check className="w-4 h-4 opacity-40" />
            <span>Complete Idea</span>
          </Button>
        )}
      </div>
    </div>
  );
}
