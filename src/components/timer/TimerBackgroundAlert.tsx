import { AlertCircle } from 'lucide-react';

interface TimerBackgroundAlertProps {
  show: boolean;
}

export function TimerBackgroundAlert({ show }: TimerBackgroundAlertProps) {
  if (!show) return null;

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-400">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight">Stopped while in background</p>
        <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 mt-0.5">
          Timer automatically stopped because the browser was minimized or running in background.
        </p>
      </div>
    </div>
  );
}
