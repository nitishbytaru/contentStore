import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, Trash2, Edit, Save, X, Copy, FileText, Video, Loader2, ExternalLink, Sparkles
} from 'lucide-react';
import { Idea } from '@/types';
import { getIdeaPublishStatus } from '@/utils/ideaStatus';
import { cn } from 'cn';

interface IdeaCardProps {
  idea: Idea;
  isEditing: boolean;
  editText: string;
  isActionLoading: boolean;
  onStartEdit: (idea: Idea) => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (ideaId: string) => void;
  onCopyIdea: (text: string) => void;
  onDeleteIdea: (ideaId: string) => void;
}

export function IdeaCard({
  idea,
  isEditing,
  editText,
  isActionLoading,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onSaveEdit,
  onCopyIdea,
  onDeleteIdea,
}: IdeaCardProps) {
  const publishStatus = getIdeaPublishStatus(idea);
  const hasBaseArticle = Boolean(idea.baseArticle && idea.baseArticle.trim().length > 0);

  const cardClasses = cn(
    'relative transition-all group border-l-4 rounded-xl hover:shadow-sm hover:border-primary/40 border-border/80',
    publishStatus.borderClass,
    publishStatus.bgClass
  );

  return (
    <Card className={cardClasses} data-tour={idea.isSample ? 'sample-idea' : undefined}>
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-3 min-h-[104px]">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full py-1">
            <Input
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="flex-1 h-9 text-sm"
              autoFocus
              disabled={isActionLoading}
            />
            <Button
              size="sm"
              onClick={() => onSaveEdit(idea.ideaId)}
              disabled={isActionLoading}
              className="h-9 px-3 gap-1 shrink-0 cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 cursor-pointer"
              onClick={onCancelEdit}
              disabled={isActionLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* Row 1: Title (left) & Status Badge (right) */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                <Link
                  href={`/ideas/${idea.ideaId}`}
                  className="text-sm sm:text-base font-medium leading-snug cursor-pointer transition-colors group-hover:text-primary block line-clamp-2 after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                  title={idea.idea}
                  data-tour={idea.isSample ? 'sample-idea-open' : undefined}
                >
                  {idea.idea}
                </Link>
                {idea.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {idea.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {idea.isSample && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      title="Created for the product tour. It is removed after 2 days unless you edit it."
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      Sample
                    </Badge>
                  )}
                  {!hasBaseArticle && (
                    <Link
                      href={`/ideas/${idea.ideaId}`}
                      className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-highlight/15 text-foreground border border-highlight/40 hover:bg-highlight/25 transition-colors"
                    >
                      <FileText className="w-3 h-3 shrink-0 opacity-80" />
                      Needs Research
                    </Link>
                  )}
                  {Boolean(idea.eligibleMedium || idea.eligibleSubstack) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-muted text-muted-foreground border-border/70">
                      <FileText className="w-3 h-3 shrink-0" />
                      Article
                    </span>
                  )}
                  {Boolean(idea.eligibleYoutube || idea.eligibleInstagram) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-muted text-muted-foreground border-border/70">
                      <Video className="w-3 h-3 shrink-0" />
                      Video
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 pt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                    publishStatus.badgeClass
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      publishStatus.dotClass
                    )}
                  />
                  {publishStatus.label}
                </span>
              </div>
            </div>

            {/* Row 2: Metadata (Date) on left & Action buttons on right */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">Created {new Date(idea.createdAt).toLocaleDateString()}</span>
              </div>

              {isActionLoading ? (
                <div className="relative z-10 flex items-center px-2 shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="relative z-10 flex items-center gap-1 shrink-0">
                  <Link
                    href={`/ideas/${idea.ideaId}`}
                    className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Open Editor"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">Editor</span>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    onClick={() => onCopyIdea(idea.idea)}
                    title="Copy Idea"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    onClick={() => onStartEdit(idea)}
                    title="Edit Idea"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    onClick={() => onDeleteIdea(idea.ideaId)}
                    title="Delete Idea"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
