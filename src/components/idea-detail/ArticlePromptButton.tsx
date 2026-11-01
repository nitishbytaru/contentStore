'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetPromptsQuery } from '@/store/api/promptsApi';
import { useApplyArticlePromptMutation } from '@/store/api/ideasApi';

export function ArticlePromptButton({
  ideaId,
  article,
  onArticle,
  onApplyingChange,
}: {
  ideaId: string;
  article: string;
  onArticle: (article: string) => void;
  onApplyingChange?: (applying: boolean) => void;
}) {
  const { data: prompts = [], isLoading } = useGetPromptsQuery();
  const [applyPrompt] = useApplyArticlePromptMutation();
  const [open, setOpen] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const chosen = prompts.find((prompt) => prompt.id === chosenId) || null;

  const apply = async () => {
    if (!chosen) return;
    setOpen(false);
    onApplyingChange?.(true);
    try {
      const result = await applyPrompt({
        ideaId,
        prompt: chosen.content,
        article,
      }).unwrap();
      onArticle(result.mediumArticle);
      toast.success('Article updated');
    } catch (err) {
      const message = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { error?: string } }).data?.error
        : '';
      toast.error(message || 'The article could not be rewritten');
    } finally {
      onApplyingChange?.(false);
    }
  };

  return (
    <>
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Sparkles className="h-3.5 w-3.5" />
          Use a prompt
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import a prompt</DialogTitle>
            <DialogDescription>
              The prompt is combined with this draft, then the finished article replaces the text here.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading prompts…</p>}
            {!isLoading && prompts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No prompts yet.{' '}
                <Link href="/prompts" className="text-primary hover:underline">
                  Add one on the prompts page
                </Link>
                .
              </p>
            )}
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => setChosenId(prompt.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  chosenId === prompt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:bg-muted/50'
                }`}
              >
                <p className="text-sm font-medium">{prompt.title || 'Untitled prompt'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{prompt.category || 'General'}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{prompt.content}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={!chosen} onClick={() => void apply()}>
              <Sparkles className="h-3.5 w-3.5" />
              Write article
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ArticleWritingOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm">
      <div
        className="w-[min(92vw,360px)] rounded-2xl border border-border/70 bg-popover p-5 shadow-lg"
        style={{ animation: 'research-in 0.35s ease-out' }}
      >
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center">
            <span
              className="absolute inset-0 rounded-full border border-primary/30"
              style={{ animation: 'idea-scan-orbit 2.4s linear infinite' }}
            />
            <span
              className="absolute inset-1 rounded-full bg-primary/25"
              style={{ animation: 'research-glow 2.2s ease-in-out infinite' }}
            />
            <Sparkles className="relative h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-medium">Writing the article</p>
            <p className="text-xs text-muted-foreground mt-0.5">The prompt and this draft are with the model.</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full w-1/3 rounded-full bg-primary"
            style={{ animation: 'research-progress 1.1s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
