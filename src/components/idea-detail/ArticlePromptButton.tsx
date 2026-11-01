'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  Check, 
  ArrowRight, 
  X, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const [search, setSearch] = useState('');
  const [chosenId, setChosenId] = useState<string | null>(null);

  // Filtered prompts based on search
  const filteredPrompts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return prompts;
    return prompts.filter((p) => {
      return (
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    });
  }, [prompts, search]);

  const chosen = useMemo(
    () => prompts.find((prompt) => prompt.id === chosenId) || null,
    [prompts, chosenId]
  );

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
      toast.success('Article updated successfully');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="group relative gap-2 border-primary/20 bg-background/80 shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="font-medium text-xs">Use a prompt</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono font-medium tracking-tight">
            AI
          </Badge>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-4 p-5 sm:max-w-xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="gap-1.5 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold tracking-tight">
                    Select a Prompt
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    {prompts.length} available
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Transform or enhance your article draft with custom AI instructions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search prompts by title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs bg-muted/40 border-border/60 focus-visible:bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Prompt List Content */}
          <ScrollArea className="h-[300px] pr-2.5">
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty Prompts in system */}
            {!isLoading && prompts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">No prompts available</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                  Create your first prompt template to quickly rewrite and improve articles.
                </p>
                <Link href="/prompts">
                  <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
                    <span>Manage Prompts</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Empty search results */}
            {!isLoading && prompts.length > 0 && filteredPrompts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="h-6 w-6 text-muted-foreground/60 mb-2" />
                <p className="text-xs font-medium text-foreground">No matching prompts</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Try adjusting your search keywords.
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSearch('')}
                  className="mt-3 text-xs text-primary"
                >
                  Clear search
                </Button>
              </div>
            )}

            {/* Prompt Cards */}
            {!isLoading && filteredPrompts.length > 0 && (
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {filteredPrompts.map((prompt) => {
                    const isSelected = chosenId === prompt.id;
                    return (
                      <motion.div
                        key={prompt.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <button
                          type="button"
                          onClick={() => setChosenId(prompt.id)}
                          onDoubleClick={() => {
                            setChosenId(prompt.id);
                            void apply();
                          }}
                          className={`group relative w-full rounded-lg border p-2.5 text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                              : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-medium tracking-tight ${isSelected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                                  {prompt.title || 'Untitled Prompt'}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                {prompt.content}
                              </p>
                            </div>

                            {/* Checkmark indicator */}
                            <div className="shrink-0 mt-0.5">
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground scale-105'
                                    : 'border-border/80 group-hover:border-primary/50'
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {/* Selected Prompt Quick Preview */}
          <AnimatePresence>
            {chosen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Sparkles className="h-3 w-3" />
                      Ready to apply
                    </span>
                    <span className="truncate max-w-[240px] text-muted-foreground text-[10px]">
                      {chosen.title}
                    </span>
                  </div>
                  <div className="max-h-16 overflow-y-auto rounded bg-background/60 p-1.5 text-[11px] font-mono leading-relaxed text-muted-foreground border border-border/40">
                    {chosen.content}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!chosen}
                onClick={() => void apply()}
                className="h-8 gap-1.5 text-xs shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Rewrite Article</span>
                <ArrowRight className="h-3 w-3 opacity-70" />
              </Button>
            </div>
          </DialogFooter>
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
            <p className="text-xs text-muted-foreground mt-0.5">The prompt and draft are being processed.</p>
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
