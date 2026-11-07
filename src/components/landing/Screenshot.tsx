'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from 'cn';

interface ScreenshotProps {
  /** File name inside public/landing/, e.g. "scan.png". */
  file: string;
  /** Descriptive alt text; also shown on the placeholder. */
  alt: string;
  priority?: boolean;
  className?: string;
}

/**
 * Real product screenshot from public/landing/. Until the file exists it shows a
 * labelled placeholder in development and renders nothing in production.
 */
export function Screenshot({ file, alt, priority = false, className }: ScreenshotProps) {
  const [missing, setMissing] = useState(false);

  // Placeholders help while building; visitors never see an empty box.
  if (missing && process.env.NODE_ENV === 'production') return null;

  return (
    <div
      className={cn(
        'relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_40px_-20px_rgb(0_0_0/0.6)]',
        className,
      )}
    >
      {missing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-foreground/20 rounded-xl p-4 text-center">
          <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-xs text-muted-foreground max-w-[32ch]">{alt}</p>
          <code className="text-[11px] text-muted-foreground/80">public/landing/{file}</code>
        </div>
      ) : (
        <Image
          src={`/landing/${file}`}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover object-top"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}
