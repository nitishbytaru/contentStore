import { cn } from 'cn';
import { TimerMode } from '@/types';

export const COUNTDOWN_PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
];

interface TimerModePresetsProps {
  mode: TimerMode;
  seconds: number;
  isRunning: boolean;
  onSelectMode: (mode: TimerMode) => void;
  onSelectPreset: (seconds: number) => void;
}

export function TimerModePresets({
  mode,
  seconds,
  isRunning,
  onSelectMode,
  onSelectPreset,
}: TimerModePresetsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="inline-flex rounded-md p-0.5 bg-muted/80 text-[11px] font-medium border border-border/40">
        <button
          type="button"
          onClick={() => onSelectMode('stopwatch')}
          className={cn(
            'px-2.5 py-1 rounded transition-colors cursor-pointer',
            mode === 'stopwatch'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Stopwatch
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('countdown')}
          className={cn(
            'px-2.5 py-1 rounded transition-colors cursor-pointer',
            mode === 'countdown'
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Countdown
        </button>
      </div>

      {mode === 'countdown' && (
        <div className="flex items-center gap-1">
          {COUNTDOWN_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectPreset(preset.seconds)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer',
                seconds === preset.seconds && !isRunning
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
