interface PrompterEyelineProps {
  show: boolean;
  activeParagraphIndex: number;
  totalParagraphs: number;
}

export function PrompterEyeline({
  show,
  activeParagraphIndex,
  totalParagraphs,
}: PrompterEyelineProps) {
  if (!show) return null;

  return (
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
        {activeParagraphIndex + 1}/{totalParagraphs || 1}
      </span>
    </div>
  );
}
