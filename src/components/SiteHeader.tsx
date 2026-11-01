'use client';

import { usePathname } from 'next/navigation';
import { NavLinks } from '@/components/NavLinks';

export function SiteHeader() {
  const pathname = usePathname();
  const isIdeaEditor = /^\/ideas\/(?!new$)[^/]+$/.test(pathname);
  if (isIdeaEditor) return null;

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full max-w-full">
      <div className="flex h-14 items-center px-4 md:px-6 max-w-6xl mx-auto w-full relative">
        <NavLinks />
      </div>
    </header>
  );
}
