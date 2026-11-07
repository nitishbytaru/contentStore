import { ChevronUp, ChevronDown } from 'lucide-react';

interface PrompterStepNavProps {
  showControls: boolean;
  activeParagraphIndex: number;
  totalParagraphs: number;
  onNavigate: (direction: number) => void;
}

export function PrompterStepNav({
  showControls,
  activeParagraphIndex,
  totalParagraphs,
  onNavigate,
}: PrompterStepNavProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-card/90 border border-border backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-40 hover:opacity-100 translate-y-2'
      }`}
    >
      <button
        type="button"
        onClick={() => onNavigate(-1)}
        disabled={activeParagraphIndex <= 0}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-white hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Previous section (Page Up)"
      >
        <ChevronUp className="w-4 h-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      <span className="text-[11px] font-mono text-muted-foreground px-2 border-x border-border">
        Section {activeParagraphIndex + 1} of {totalParagraphs || 1}
      </span>

      <button
        type="button"
        onClick={() => onNavigate(1)}
        disabled={activeParagraphIndex >= totalParagraphs - 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-white hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Next section (Page Down)"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
