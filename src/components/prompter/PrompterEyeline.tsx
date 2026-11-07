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
        <span className="w-2.5 h-2.5 rounded-full bg-highlight animate-ping opacity-75" />
        <span className="w-2 h-2 rounded-full bg-highlight" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-highlight font-mono">
          Eye Line / Camera
        </span>
      </div>
      <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-highlight/30 via-highlight/60 to-highlight/30 shadow-[0_0_8px_rgb(191_0_255/0.5)]" />
      <span className="text-[10px] font-mono text-muted-foreground">
        {activeParagraphIndex + 1}/{totalParagraphs || 1}
      </span>
    </div>
  );
}
