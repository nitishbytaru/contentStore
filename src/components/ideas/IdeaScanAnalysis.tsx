'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const STEPS = [
  'Reading the idea you just typed',
  'Walking through ideas already saved',
  'Comparing topics, not just the words',
  'Ranking the closest matches',
];

export function IdeaScanAnalysis() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div
        className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/15 to-transparent"
        style={{ animation: 'idea-scan-sweep 1.8s ease-in-out infinite' }}
      />

      <div className="relative flex items-center gap-3">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center">
          <span
            className="absolute inset-0 rounded-full border border-dashed border-primary/50"
            style={{ animation: 'idea-scan-orbit 3.2s linear infinite' }}
          />
          <span className="absolute inset-1 rounded-full bg-primary/15 animate-pulse" />
          <Sparkles className="relative h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Analyzing your library
          </p>
          <p className="mt-0.5 text-sm text-foreground truncate" key={step}>
            {STEPS[step]}
          </p>
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-2 rounded-md border border-border/50 bg-background/70 px-3 py-2"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${row * 0.2}s` }}
            />
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full w-2/5 rounded-full bg-primary/50"
                style={{ animation: `idea-scan-sweep 1.6s ease-in-out ${row * 0.25}s infinite` }}
              />
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-primary/15">
        <span
          className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
          style={{ animation: 'idea-scan-sweep 1.4s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
}
