import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Idea } from '@/types';

interface IdeaResearchStepProps {
  idea: Idea;
  initialResearchText: string;
  saving: boolean;
  onTextChange: (text: string) => void;
  onSubmitResearch: () => void;
  onSkipResearch: () => void;
}

export function IdeaResearchStep({
  idea,
  initialResearchText,
  saving,
  onTextChange,
  onSubmitResearch,
  onSkipResearch,
}: IdeaResearchStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-2">
      <Link
        href="/ideas"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Ideas
      </Link>

      {/* Idea Banner */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">New Content Idea</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
          {idea.idea}
        </h1>
      </div>

      {/* Paste Initial Research Card */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-border/40 bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Paste Initial Research</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Paste your raw research, key takeaways, links, or bullet points to get started.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Research Content</span>
              {initialResearchText.trim().length > 0 && (
                <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded-full">
                  {initialResearchText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <Textarea
              placeholder="Paste your initial research notes, outline, source links, or raw brainstorm here..."
              value={initialResearchText}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-[260px] sm:min-h-[320px] max-h-[60vh] text-sm leading-relaxed p-4"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkipResearch}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Skip research for now
            </Button>
            <Button
              type="button"
              onClick={onSubmitResearch}
              disabled={!initialResearchText.trim() || saving}
              className="font-medium gap-2 shadow-sm px-5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Submit Initial Research</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
