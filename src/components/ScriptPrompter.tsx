'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Minimize2, 
  Maximize2, 
  FlipHorizontal, 
  Eye, 
  Settings2,
  Tv,
  ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScriptPrompterProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  script: string;
}

export default function ScriptPrompter({
  isOpen,
  onClose,
  title,
  script,
}: ScriptPrompterProps) {
  // Prompter configuration states
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1 to 10
  const [fontSize, setFontSize] = useState(44); // px, default large for distance reading
  const [isMirrored, setIsMirrored] = useState(false);
  const [showEyeLine, setShowEyeLine] = useState(true);
  const [highlightMode, setHighlightMode] = useState(true); // highlight active paragraph "one after another"
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Split script into readable blocks / paragraphs
  const paragraphs = script
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const totalWords = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMins = Math.max(1, Math.round(totalWords / 130)); // 130 words per minute speaking rate

  // Fullscreen support
  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleClose = useCallback(() => {
    setIsPlaying(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Auto-hide controls during playback on inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, resetControlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSpeed(prev => Math.min(10, prev + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSpeed(prev => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        navigateParagraph(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        navigateParagraph(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Smooth auto-scroll loop
  useEffect(() => {
    if (!isPlaying || !scrollAreaRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTimestamp: number | null = null;
    const scrollEl = scrollAreaRef.current;

    const step = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Speed scale: speed 1 = ~25px/sec, speed 10 = ~250px/sec
      const pixelsToScroll = ((speed * 25) / 1000) * delta;
      scrollEl.scrollTop += pixelsToScroll;

      // Check if reached the bottom
      if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 5) {
        setIsPlaying(false);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Track active paragraph based on scroll position (eye-line is ~30% from top)
  const handleScroll = () => {
    if (!scrollAreaRef.current || paragraphs.length === 0) return;
    const scrollContainer = scrollAreaRef.current;
    const eyeLineOffset = scrollContainer.scrollTop + scrollContainer.clientHeight * 0.35;

    for (let i = 0; i < paragraphRefs.current.length; i++) {
      const el = paragraphRefs.current[i];
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.clientHeight;
        if (eyeLineOffset >= top && eyeLineOffset <= bottom) {
          setActiveParagraphIndex(i);
          break;
        }
      }
    }
  };

  const navigateParagraph = (direction: number) => {
    const nextIdx = Math.max(0, Math.min(paragraphs.length - 1, activeParagraphIndex + direction));
    setActiveParagraphIndex(nextIdx);
    const targetEl = paragraphRefs.current[nextIdx];
    if (targetEl && scrollAreaRef.current) {
      const offset = targetEl.offsetTop - scrollAreaRef.current.clientHeight * 0.25;
      scrollAreaRef.current.scrollTo({
        top: Math.max(0, offset),
        behavior: 'smooth',
      });
    }
  };

  const jumpToParagraph = (index: number) => {
    setActiveParagraphIndex(index);
    const targetEl = paragraphRefs.current[index];
    if (targetEl && scrollAreaRef.current) {
      const offset = targetEl.offsetTop - scrollAreaRef.current.clientHeight * 0.25;
      scrollAreaRef.current.scrollTo({
        top: Math.max(0, offset),
        behavior: 'smooth',
      });
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveParagraphIndex(0);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none overflow-hidden font-sans"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Eye-line Reading Guide (Centered near upper 33% where camera sits) */}
      {showEyeLine && (
        <div 
          className="pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-between px-6 transition-opacity duration-300"
          style={{ top: '35%' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-red-400/90 font-mono">
              Eye Line / Camera
            </span>
          </div>
          <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-red-500/30 via-red-500/60 to-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[10px] font-mono text-zinc-500">
            {activeParagraphIndex + 1}/{paragraphs.length || 1}
          </span>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <header
        className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showControls 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-b from-zinc-950/95 via-zinc-950/80 to-transparent p-4 sm:p-6 pb-10">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl">
            {/* Title & Metadata */}
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {title || 'Video Script Prompter'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                  <span>{totalWords} words</span>
                  <span>•</span>
                  <span>~{estimatedMins} min read</span>
                </div>
              </div>
            </div>

            {/* Quick Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Play / Pause Primary Button */}
              <Button
                size="sm"
                variant="default"
                onClick={() => setIsPlaying(prev => !prev)}
                className={`h-9 px-4 font-semibold rounded-xl gap-2 transition-transform active:scale-95 ${
                  isPlaying 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 shadow-lg' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 shadow-lg'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                <kbd className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">Space</kbd>
              </Button>

              {/* Reset to Start */}
              <Button
                size="icon-sm"
                variant="outline"
                onClick={handleReset}
                title="Restart script"
                className="h-9 w-9 rounded-xl border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-200"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              {/* Speed Controls */}
              <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 h-9 gap-1 text-xs font-mono">
                <span className="text-zinc-500 mr-1 text-[11px]">Speed</span>
                <button
                  onClick={() => setSpeed(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  title="Slower (Arrow Down)"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-zinc-100">{speed}x</span>
                <button
                  onClick={() => setSpeed(prev => Math.min(10, prev + 1))}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  title="Faster (Arrow Up)"
                >
                  +
                </button>
              </div>

              {/* Font Size Scale for Distance Readability */}
              <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 h-9 gap-1 text-xs font-mono">
                <span className="text-zinc-500 mr-1 text-[11px]">Size</span>
                <button
                  onClick={() => setFontSize(prev => Math.max(24, prev - 4))}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  title="Smaller text"
                >
                  A-
                </button>
                <span className="w-8 text-center font-bold text-zinc-100">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(prev => Math.min(76, prev + 4))}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  title="Larger text for far distance"
                >
                  A+
                </button>
              </div>

              {/* Toggle "One After Another" Paragraph Highlighting */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHighlightMode(prev => !prev)}
                title="Focus mode (highlights active paragraph)"
                className={`h-9 px-2.5 rounded-xl border-zinc-700 text-xs gap-1.5 ${
                  highlightMode 
                    ? 'bg-primary/20 text-primary border-primary/40' 
                    : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Focus</span>
              </Button>

              {/* Toggle Eye Line Guide */}
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setShowEyeLine(prev => !prev)}
                title="Toggle camera eye-line guide"
                className={`h-9 w-9 rounded-xl border-zinc-700 ${
                  showEyeLine 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                    : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Eye className="w-4 h-4" />
              </Button>

              {/* Mirror / Flip for Glass Prompters */}
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setIsMirrored(prev => !prev)}
                title="Mirror horizontally for teleprompter glass"
                className={`h-9 w-9 rounded-xl border-zinc-700 ${
                  isMirrored 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' 
                    : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
              </Button>

              {/* Fullscreen API Toggle */}
              <Button
                size="icon-sm"
                variant="outline"
                onClick={toggleNativeFullscreen}
                title="Toggle native fullscreen"
                className="h-9 w-9 rounded-xl border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Reading Screen Area */}
      <main
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth relative"
        style={{
          transform: isMirrored ? 'scaleX(-1)' : 'none',
        }}
      >
        {/* Generous top & bottom padding so the first & last paragraphs can align to the eye-line */}
        <div className="pt-[35vh] pb-[60vh] max-w-4xl mx-auto px-6 sm:px-12 md:px-16 space-y-12">
          {paragraphs.length === 0 ? (
            <div className="py-24 text-center text-zinc-500 text-xl font-light">
              No script text provided. Please draft your video script in the editor first.
            </div>
          ) : (
            paragraphs.map((paragraph, idx) => {
              const isActive = highlightMode && idx === activeParagraphIndex;
              return (
                <p
                  key={idx}
                  ref={el => {
                    paragraphRefs.current[idx] = el;
                  }}
                  onClick={() => jumpToParagraph(idx)}
                  className={`cursor-pointer transition-all duration-300 font-semibold tracking-normal leading-[1.4] select-text ${
                    isActive
                      ? 'text-white opacity-100 scale-[1.02] drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]'
                      : highlightMode
                      ? 'text-zinc-400 opacity-35 hover:opacity-75 hover:text-zinc-200'
                      : 'text-zinc-100 opacity-95'
                  }`}
                  style={{
                    fontSize: `${fontSize}px`,
                  }}
                >
                  {paragraph}
                </p>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Center Floating Step Controls (Previous / Next Paragraph) */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-40 hover:opacity-100 translate-y-2'
        }`}
      >
        <button
          onClick={() => navigateParagraph(-1)}
          disabled={activeParagraphIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous section (Page Up)"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <span className="text-[11px] font-mono text-zinc-400 px-2 border-x border-zinc-800">
          Section {activeParagraphIndex + 1} of {paragraphs.length || 1}
        </span>

        <button
          onClick={() => navigateParagraph(1)}
          disabled={activeParagraphIndex >= paragraphs.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next section (Page Down)"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* BOTTOM RIGHT CORNER EXIT BUTTON (Strictly requested by User) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleClose}
          className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-white font-semibold text-sm shadow-[0_10px_35px_rgba(0,0,0,0.8)] border border-zinc-700/80 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
          title="Exit Prompter and return to normal screen (Esc)"
        >
          <Minimize2 className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
          <span>Exit Prompter</span>
          <kbd className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700 font-mono shadow-inner">
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
}
