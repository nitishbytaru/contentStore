'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthUrlError } from '@/components/auth/AuthUrlError';
import { OrDivider } from '@/components/auth/OrDivider';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/ideas');
    router.refresh();
  };

  return (
    <AuthShell title="Welcome back" description="Log in to pick up your ideas where you left them.">
      <div data-auth-stagger className="flex flex-col gap-5">
        <Suspense fallback={null}>
          <AuthUrlError />
        </Suspense>
        <GoogleSignInButton label="Continue with Google" disabled={loading} />
        <OrDivider label="or with email" />
        <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
          {error && (
            <Alert key={error} data-auth-shake variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="h-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              className="h-10"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" size="lg" className="mt-1 h-10 w-full font-semibold transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgb(44_255_5/0.55)]" disabled={loading}>
            {loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          New to ContentStore?{' '}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
