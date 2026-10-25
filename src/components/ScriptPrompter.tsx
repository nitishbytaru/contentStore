'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PrompterHeader,
  PrompterEyeline,
  PrompterScriptViewer,
  PrompterStepNav,
  PrompterExitButton,
} from './prompter';

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
  const [highlightMode, setHighlightMode] = useState(true); // highlight active paragraph
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
    .map((p) => p.trim())
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSpeed((prev) => Math.min(10, prev + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSpeed((prev) => Math.max(1, prev - 1));
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

  // Track active paragraph based on scroll position (eye-line is ~35% from top)
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

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none overflow-hidden font-sans"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Eye-line Reading Guide */}
      <PrompterEyeline
        show={showEyeLine}
        activeParagraphIndex={activeParagraphIndex}
        totalParagraphs={paragraphs.length}
      />

      {/* Top Floating Control Bar */}
      <PrompterHeader
        title={title}
        totalWords={totalWords}
        estimatedMins={estimatedMins}
        isPlaying={isPlaying}
        speed={speed}
        fontSize={fontSize}
        highlightMode={highlightMode}
        showEyeLine={showEyeLine}
        isMirrored={isMirrored}
        isFullscreen={isFullscreen}
        showControls={showControls}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        onReset={handleReset}
        onChangeSpeed={(delta) => setSpeed((prev) => Math.max(1, Math.min(10, prev + delta)))}
        onChangeFontSize={(delta) => setFontSize((prev) => Math.max(24, Math.min(76, prev + delta)))}
        onToggleHighlightMode={() => setHighlightMode((prev) => !prev)}
        onToggleEyeLine={() => setShowEyeLine((prev) => !prev)}
        onToggleMirror={() => setIsMirrored((prev) => !prev)}
        onToggleFullscreen={toggleNativeFullscreen}
      />

      {/* Main Reading Screen Area */}
      <PrompterScriptViewer
        scrollAreaRef={scrollAreaRef}
        paragraphRefs={paragraphRefs}
        paragraphs={paragraphs}
        fontSize={fontSize}
        highlightMode={highlightMode}
        activeParagraphIndex={activeParagraphIndex}
        isMirrored={isMirrored}
        onScroll={handleScroll}
        onJumpToParagraph={jumpToParagraph}
      />

      {/* Bottom Center Floating Step Controls */}
      <PrompterStepNav
        showControls={showControls}
        activeParagraphIndex={activeParagraphIndex}
        totalParagraphs={paragraphs.length}
        onNavigate={navigateParagraph}
      />

      {/* Bottom Right Corner Exit Button */}
      <PrompterExitButton onExit={handleClose} />
    </div>
  );
}
