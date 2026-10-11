'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const links = [
  { href: '/', label: 'Analytics' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/prompts', label: 'Prompts' },
];

export function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoginPage = pathname === '/login';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Link
        href={isLoginPage ? '#' : '/'}
        className="font-bold text-lg tracking-tight mr-6 shrink-0 text-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        ContentStore
      </Link>

      {!isLoginPage && (
        <>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {links.map(({ href, label }) => {
              const isActive =
                href === '/'
                  ? pathname === '/' || pathname === '/analytics'
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

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent hover:border-border/60 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
