import { Smartphone, AlertCircle, Pin, PinOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerHeaderProps {
  isRunning: boolean;
  stoppedDueToBackground: boolean;
  isFloating: boolean;
  isCollapsed: boolean;
  onToggleFloating: () => void;
  onToggleCollapsed: () => void;
}

export function TimerHeader({
  isRunning,
  stoppedDueToBackground,
  isFloating,
  isCollapsed,
  onToggleFloating,
  onToggleCollapsed,
}: TimerHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-tight text-foreground truncate">
            Mobile Session Timer
          </h3>
          {isRunning ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          ) : stoppedDueToBackground ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" />
              Background Stopped
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              Idle
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFloating}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={isFloating ? 'Unpin from bottom' : 'Pin floating to bottom'}
          aria-label={isFloating ? 'Unpin timer' : 'Pin timer'}
        >
          {isFloating ? <PinOff className="w-3.5 h-3.5 text-primary" /> : <Pin className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={isCollapsed ? 'Expand timer' : 'Collapse timer'}
          aria-label={isCollapsed ? 'Expand timer' : 'Collapse timer'}
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}
