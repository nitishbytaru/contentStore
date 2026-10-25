import { FileText, Video, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

interface IdeaFormatModalProps {
  isOpen: boolean;
  isArticleSelected: boolean;
  isVideoSelected: boolean;
  saving: boolean;
  onClose: () => void;
  onToggleFormat: (format: 'article' | 'video', enable: boolean) => void;
}

export function IdeaFormatModal({
  isOpen,
  isArticleSelected,
  isVideoSelected,
  saving,
  onClose,
  onToggleFormat,
}: IdeaFormatModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">Content Formats</h3>
            <p className="text-xs text-muted-foreground">Select the navigation workspaces for this idea.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Article format toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold">Article Draft</h4>
                <p className="text-[11px] text-muted-foreground">Medium, Substack, blog post</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isArticleSelected ? 'default' : 'outline'}
              onClick={() => onToggleFormat('article', !isArticleSelected)}
              disabled={saving}
              className={cn(
                'h-8 text-xs font-medium cursor-pointer',
                isArticleSelected && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {isArticleSelected ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
              {isArticleSelected ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          {/* Video format toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold">Video Script</h4>
                <p className="text-[11px] text-muted-foreground">YouTube script &amp; prompter</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isVideoSelected ? 'default' : 'outline'}
              onClick={() => onToggleFormat('video', !isVideoSelected)}
              disabled={saving}
              className={cn('h-8 text-xs font-medium cursor-pointer', isVideoSelected && 'bg-rose-600 hover:bg-rose-700')}
            >
              {isVideoSelected ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
              {isVideoSelected ? 'Enabled' : 'Enable'}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button size="sm" onClick={onClose} className="cursor-pointer">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
