'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Smartphone, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Pin,
  PinOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from 'cn';

type TimerMode = 'stopwatch' | 'countdown';

const COUNTDOWN_PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
];

export function MobileTimer() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stoppedDueToBackground, setStoppedDueToBackground] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isFloating, setIsFloating] = useState<boolean>(false);

  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  // 1. Mobile viewport detection: only works on mobile screens (< 768px)
  useEffect(() => {
    const checkIsMobile = () => {
      const mobileMatch = window.innerWidth < 768;
      setIsMobile(mobileMatch);
      // Auto-pause if user resizes window to desktop size
      if (!mobileMatch && isRunningRef.current) {
        setIsRunning(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 2. Browser Minimization & Background detection:
  // Immediately stops timer when browser is minimized, sent to background, tab switched, or screen locked.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        if (isRunningRef.current) {
          setIsRunning(false);
          setStoppedDueToBackground(true);
        }
      }
    };

    const handlePageHide = () => {
      if (isRunningRef.current) {
        setIsRunning(false);
        setStoppedDueToBackground(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // 3. Interval ticking: only advances while active and browser is in foreground
  useEffect(() => {
    if (!isRunning || !isMobile) return;

    const interval = setInterval(() => {
      // Extra safety check: if document becomes hidden, stop immediately
      if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        setIsRunning(false);
        setStoppedDueToBackground(true);
        return;
      }

      if (mode === 'stopwatch') {
        setSeconds((prev) => prev + 1);
      } else {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.success("Timer completed!");
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([200, 100, 200]);
              } catch {
                // Ignore vibration failure
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isMobile, mode]);

  // Format MM:SS or HH:MM:SS
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

  const handleStart = () => {
    if (!isMobile) {
      toast.error('This timer is designed exclusively for mobile devices.');
      return;
    }
    if (mode === 'countdown' && seconds === 0) {
      setSeconds(COUNTDOWN_PRESETS[1].seconds); // Default to 15m if at 0
    }
    setStoppedDueToBackground(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStoppedDueToBackground(false);
    if (mode === 'countdown') {
      setSeconds(15 * 60);
    } else {
      setSeconds(0);
    }
  };

  const selectPreset = (presetSecs: number) => {
    setIsRunning(false);
    setStoppedDueToBackground(false);
    setMode('countdown');
    setSeconds(presetSecs);
  };

  // Do not render anything on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        "block md:hidden transition-all duration-200",
        isFloating
          ? "fixed bottom-5 right-4 left-4 z-40 max-w-sm mx-auto shadow-2xl animate-in slide-in-from-bottom-4"
          : "w-full"
      )}
    >
      <Card className="border border-border/80 bg-card/95 backdrop-blur-md shadow-sm overflow-hidden">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          {/* Header Row */}
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
                onClick={() => setIsFloating(!isFloating)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={isFloating ? "Unpin from bottom" : "Pin floating to bottom"}
                aria-label={isFloating ? "Unpin timer" : "Pin timer"}
              >
                {isFloating ? <PinOff className="w-3.5 h-3.5 text-primary" /> : <Pin className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={isCollapsed ? "Expand timer" : "Collapse timer"}
                aria-label={isCollapsed ? "Expand timer" : "Collapse timer"}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Minimization / Background Stop Alert */}
          {stoppedDueToBackground && !isRunning && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">Stopped while in background</p>
                <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 mt-0.5">
                  Timer automatically stopped because the browser was minimized or running in background.
                </p>
              </div>
            </div>
          )}

          {/* Timer Display & Main Controls */}
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
                  onClick={handlePause}
                  variant="outline"
                  className="h-8 px-3 gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStart}
                  className="h-8 px-3 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {stoppedDueToBackground || seconds > 0 ? 'Resume' : 'Start'}
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Reset timer"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Collapsible Mode & Presets Row */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-md p-0.5 bg-muted/80 text-[11px] font-medium border border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setMode('stopwatch');
                      setSeconds(0);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      mode === 'stopwatch'
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Stopwatch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setMode('countdown');
                      setSeconds(15 * 60);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded transition-colors",
                      mode === 'countdown'
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
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
                        onClick={() => selectPreset(preset.seconds)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border transition-colors",
                          seconds === preset.seconds && !isRunning
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <span>Timer strictly pauses if the mobile browser is minimized or sent to background.</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
