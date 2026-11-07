'use client';

import { BookOpen, FileText, Lightbulb, Loader2, Sparkles, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md" showCloseButton={!starting}>
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

        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PIPELINE.map(({ icon: Icon, label, hint }, index) => (
            <li key={label}>
              <Card size="sm" className="h-full bg-muted/30">
                <CardContent className="flex flex-col items-center gap-1 text-center">
                  <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" disabled={starting} onClick={onDismiss}>
            Skip, I know my way around
          </Button>
          <Button type="button" disabled={starting} onClick={onStart}>
            {starting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
            {starting ? 'Preparing your sample…' : 'Show me around (2 min)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
