import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerMode } from '@/types';

interface TimerDisplayProps {
  seconds: number;
  mode: TimerMode;
  isRunning: boolean;
  stoppedDueToBackground: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerDisplay({
  seconds,
  mode,
  isRunning,
  stoppedDueToBackground,
  onStart,
  onPause,
  onReset,
}: TimerDisplayProps) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      {/* Clock Digits */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider tabular-nums text-foreground">
          {formatTime(seconds)}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase font-medium">
          {mode === 'stopwatch' ? 'count-up' : 'countdown'}
        </span>
      </div>

      {/* Play/Pause & Reset Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isRunning ? (
          <Button
            size="sm"
            onClick={onPause}
            variant="outline"
            className="h-8 px-3 gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onStart}
            className="h-8 px-3 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {stoppedDueToBackground || seconds > 0 ? 'Resume' : 'Start'}
          </Button>
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={onReset}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
