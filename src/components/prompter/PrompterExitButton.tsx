import { Minimize2 } from 'lucide-react';

interface PrompterExitButtonProps {
  onExit: () => void;
}

export function PrompterExitButton({ onExit }: PrompterExitButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={onExit}
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
  );
}
