import React from 'react';

interface PrompterScriptViewerProps {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  paragraphRefs: React.MutableRefObject<(HTMLParagraphElement | null)[]>;
  paragraphs: string[];
  fontSize: number;
  highlightMode: boolean;
  activeParagraphIndex: number;
  isMirrored: boolean;
  onScroll: () => void;
  onJumpToParagraph: (index: number) => void;
}

export function PrompterScriptViewer({
  scrollAreaRef,
  paragraphRefs,
  paragraphs,
  fontSize,
  highlightMode,
  activeParagraphIndex,
  isMirrored,
  onScroll,
  onJumpToParagraph,
}: PrompterScriptViewerProps) {
  return (
    <main
      ref={scrollAreaRef}
      onScroll={onScroll}
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
                ref={(el) => {
                  paragraphRefs.current[idx] = el;
                }}
                onClick={() => onJumpToParagraph(idx)}
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
  );
}
