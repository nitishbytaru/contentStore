import { 
  Play, 
  Pause, 
  RotateCcw, 
  FlipHorizontal, 
  Eye, 
  Tv, 
  ListOrdered, 
  Minimize2, 
  Maximize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrompterHeaderProps {
  title: string;
  totalWords: number;
  estimatedMins: number;
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  highlightMode: boolean;
  showEyeLine: boolean;
  isMirrored: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onChangeSpeed: (delta: number) => void;
  onChangeFontSize: (delta: number) => void;
  onToggleHighlightMode: () => void;
  onToggleEyeLine: () => void;
  onToggleMirror: () => void;
  onToggleFullscreen: () => void;
}

export function PrompterHeader({
  title,
  totalWords,
  estimatedMins,
  isPlaying,
  speed,
  fontSize,
  highlightMode,
  showEyeLine,
  isMirrored,
  isFullscreen,
  showControls,
  onTogglePlay,
  onReset,
  onChangeSpeed,
  onChangeFontSize,
  onToggleHighlightMode,
  onToggleEyeLine,
  onToggleMirror,
  onToggleFullscreen,
}: PrompterHeaderProps) {
  return (
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
              onClick={onTogglePlay}
              className={`h-9 px-4 font-semibold rounded-xl gap-2 transition-transform active:scale-95 cursor-pointer ${
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
              onClick={onReset}
              title="Restart script"
              className="h-9 w-9 rounded-xl border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Speed Controls */}
            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 h-9 gap-1 text-xs font-mono">
              <span className="text-zinc-500 mr-1 text-[11px]">Speed</span>
              <button
                type="button"
                onClick={() => onChangeSpeed(-1)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Slower (Arrow Down)"
              >
                -
              </button>
              <span className="w-5 text-center font-bold text-zinc-100">{speed}x</span>
              <button
                type="button"
                onClick={() => onChangeSpeed(1)}
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
                type="button"
                onClick={() => onChangeFontSize(-4)}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
                title="Smaller text"
              >
                A-
              </button>
              <span className="w-8 text-center font-bold text-zinc-100">{fontSize}px</span>
              <button
                type="button"
                onClick={() => onChangeFontSize(4)}
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
              onClick={onToggleHighlightMode}
              title="Focus mode (highlights active paragraph)"
              className={`h-9 px-2.5 rounded-xl border-zinc-700 text-xs gap-1.5 cursor-pointer ${
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
              onClick={onToggleEyeLine}
              title="Toggle camera eye-line guide"
              className={`h-9 w-9 rounded-xl border-zinc-700 cursor-pointer ${
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
              onClick={onToggleMirror}
              title="Mirror horizontally for teleprompter glass"
              className={`h-9 w-9 rounded-xl border-zinc-700 cursor-pointer ${
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
              onClick={onToggleFullscreen}
              title="Toggle native fullscreen"
              className="h-9 w-9 rounded-xl border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
