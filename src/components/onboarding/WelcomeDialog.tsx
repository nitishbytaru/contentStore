'use client';

import { BookOpen, FileText, Lightbulb, Loader2, Sparkles, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PIPELINE = [
  { icon: Lightbulb, label: 'Idea', hint: 'Capture it' },
  { icon: BookOpen, label: 'Research', hint: 'Ask your sources' },
  { icon: FileText, label: 'Article', hint: 'Draft with AI' },
  { icon: Tv, label: 'Video', hint: 'Script & prompter' },
];

export function WelcomeDialog({
  open,
  starting,
  onStart,
  onDismiss,
}: {
  open: boolean;
  starting: boolean;
  onStart: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !starting) onDismiss();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!starting}>
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg">Welcome to ContentStore</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Turn one idea into a researched article and a ready-to-record video script. Take a quick hands-on
            tour with a sample idea we prepared for you. You don&apos;t need to type anything.
          </DialogDescription>
        </DialogHeader>

        <ol className="grid grid-cols-4 gap-1.5">
          {PIPELINE.map(({ icon: Icon, label, hint }, index) => (
            <li key={label} className="relative flex flex-col items-center gap-1 rounded-lg border border-border/70 bg-muted/30 px-1 py-2.5 text-center">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-semibold">{label}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>
              {index < PIPELINE.length - 1 && (
                <span aria-hidden className="absolute -right-[7px] top-1/2 z-10 -translate-y-1/2 text-[10px] text-muted-foreground">
                  ›
                </span>
              )}
            </li>
          ))}
        </ol>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" disabled={starting} onClick={onDismiss}>
            I&apos;ll explore myself
          </Button>
          <Button type="button" disabled={starting} onClick={onStart}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {starting ? 'Preparing your sample…' : 'Show me around (2 min)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
