import { FileText, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Idea, OnboardingStep } from '@/types';

interface IdeaQuestionStepProps {
  idea: Idea;
  step: OnboardingStep;
  saving: boolean;
  onAnswerArticle: (answer: boolean) => void;
  onAnswerVideo: (answer: boolean) => void;
}

export function IdeaQuestionStep({
  idea,
  step,
  saving,
  onAnswerArticle,
  onAnswerVideo,
}: IdeaQuestionStepProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4">
      <div className="text-center space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Content Setup</span>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-md mx-auto">
          {idea.idea}
        </h2>
      </div>

      {/* Question 1: Article */}
      {step === 'QUESTION_ARTICLE' && (
        <Card className="border-border/80 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <CardContent className="p-6 sm:p-8 text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Question 1 of 2
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Are you writing an article for this?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Enables an Article drafting workspace for Medium, Substack, and long-form blog posts.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => onAnswerArticle(false)}
                className="w-full text-sm font-medium border-border/80 hover:bg-muted cursor-pointer"
              >
                No
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => onAnswerArticle(true)}
                className="w-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                Yes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question 2: Video */}
      {step === 'QUESTION_VIDEO' && (
        <Card className="border-border/80 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <CardContent className="p-6 sm:p-8 text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xs">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Question 2 of 2
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Are you creating a video for this?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Enables a Video Script workspace complete with our full-screen teleprompter.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => onAnswerVideo(false)}
                disabled={saving}
                className="w-full text-sm font-medium border-border/80 hover:bg-muted cursor-pointer"
              >
                No
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => onAnswerVideo(true)}
                disabled={saving}
                className="w-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Yes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
