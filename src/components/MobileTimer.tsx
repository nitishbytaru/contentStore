'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from 'cn';
import { useGetIdeasQuery } from '@/store/api/ideasApi';
import { recordTopicTime } from '@/lib/timeTracking';
import { TimerMode } from '@/types';
import {
  TimerHeader,
  TimerBackgroundAlert,
  TimerDisplay,
  TimerModePresets,
  TimerTopicSelector,
  COUNTDOWN_PRESETS,
} from './timer';

export function MobileTimer() {
  const { data: ideas = [] } = useGetIdeasQuery();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stoppedDueToBackground, setStoppedDueToBackground] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;
  const selectedTopicIdRef = useRef<string>(selectedTopicId);
  selectedTopicIdRef.current = selectedTopicId;

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
            toast.success('Timer completed!');
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

      // Record 1 second to the selected topic
      if (selectedTopicIdRef.current) {
        recordTopicTime(selectedTopicIdRef.current, 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isMobile, mode]);

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

  const selectMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'stopwatch') {
      setSeconds(0);
    } else {
      setSeconds(15 * 60);
    }
  };

  // Do not render anything on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        'block md:hidden transition-all duration-200',
        isFloating
          ? 'fixed bottom-5 right-4 left-4 z-40 max-w-sm mx-auto shadow-2xl animate-in slide-in-from-bottom-4'
          : 'w-full'
      )}
    >
      <Card className="border border-border/80 bg-card/95 backdrop-blur-md shadow-sm overflow-hidden">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          {/* Header */}
          <TimerHeader
            isRunning={isRunning}
            stoppedDueToBackground={stoppedDueToBackground}
            isFloating={isFloating}
            isCollapsed={isCollapsed}
            onToggleFloating={() => setIsFloating(!isFloating)}
            onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
          />

          {/* Minimization / Background Stop Alert */}
          <TimerBackgroundAlert show={stoppedDueToBackground && !isRunning} />

          {/* Timer Display & Main Controls */}
          <TimerDisplay
            seconds={seconds}
            mode={mode}
            isRunning={isRunning}
            stoppedDueToBackground={stoppedDueToBackground}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />

          {/* Collapsible Mode & Presets Row */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <TimerModePresets
                mode={mode}
                seconds={seconds}
                isRunning={isRunning}
                onSelectMode={selectMode}
                onSelectPreset={selectPreset}
              />

              <TimerTopicSelector
                ideas={ideas}
                selectedTopicId={selectedTopicId}
                onSelectTopic={setSelectedTopicId}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
