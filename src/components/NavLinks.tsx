'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Ideas' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/analytics', label: 'Analytics' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" className="font-bold text-lg tracking-tight mr-6 shrink-0 text-foreground">
        ContentStore
      </Link>
      <nav className="flex items-center gap-1 text-sm font-medium">
        {links.map(({ href, label }) => {
          const isActive = href === '/'
            ? pathname === '/' || pathname.startsWith('/ideas')
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
