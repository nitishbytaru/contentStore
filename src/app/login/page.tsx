'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus password input for effortless login
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Please enter your passcode');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.error || 'Authentication failed';
        setErrorMessage(errorText);
        toast.error(errorText);
        setIsLoading(false);
        setPassword('');
        inputRef.current?.focus();
        return;
      }

      toast.success('Welcome back! Logging in...');
      // Smoothly navigate to the requested page or home
      router.push(from);
      router.refresh();
    } catch {
      setErrorMessage('Connection failed. Please try again.');
      toast.error('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Decorative backdrop glow */}
      <div className="relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-8 shadow-2xl transition-all">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-muted via-accent to-muted/80 border border-border/80 flex items-center justify-center shadow-inner mb-4 relative group">
              <Lock className="w-6 h-6 text-foreground/90 transition-transform group-hover:scale-110 duration-200" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-card">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              ContentStore Access
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Enter your master passcode to access your content repository and analytics.
            </p>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium text-xs leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
              >
                Passcode
              </label>

              <div className="relative">
                <Input
                  ref={inputRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter passcode..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={isLoading}
                  className="pr-10 h-11 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-ring text-base placeholder:text-muted-foreground/50 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Login Convenience: Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors"
              >
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  className="border-border/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span>Remember me for 90 days</span>
              </label>
              <span className="text-[11px] text-muted-foreground/70 font-mono">
                Auto-saved
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold tracking-wide gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md group mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>Unlocking...</span>
                </div>
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Quick info note */}
          <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-center gap-2 text-xs text-muted-foreground/75">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span>Single-device session encryption active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md h-80 rounded-2xl border border-border/40 bg-card/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
