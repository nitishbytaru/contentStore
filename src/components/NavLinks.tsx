'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out successfully');
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-between min-w-0">
      {/* Brand Logo */}
      <Link
        href={isLoginPage ? '#' : '/'}
        onClick={() => setMobileMenuOpen(false)}
        className="font-bold text-base sm:text-lg tracking-tight shrink-0 text-foreground flex items-center gap-2 hover:opacity-90 transition-opacity min-w-0"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="truncate">ContentStore</span>
      </Link>

      {!isLoginPage && (
        <>
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium ml-6">
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
                      ? 'text-foreground bg-muted font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Sign out Button */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
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

          {/* Mobile Right Controls: Sign out icon + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle navigation menu"
              aria-label="Toggle navigation menu"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu (Overlaid cleanly without expanding header width) */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-14 left-0 right-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-xl px-4 py-3 z-50 animate-in slide-in-from-top-2 duration-150">
              <div className="flex flex-col gap-1 max-w-6xl mx-auto w-full">
                {links.map(({ href, label }) => {
                  const isActive =
                    href === '/'
                      ? pathname === '/' || pathname === '/analytics'
                      : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                        isActive
                          ? 'text-foreground bg-muted font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span>{label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </Link>
                  );
                })}

                <div className="pt-2 mt-1 border-t border-border/40">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
