'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthUrlError } from '@/components/auth/AuthUrlError';
import { OrDivider } from '@/components/auth/OrDivider';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Check if email confirmation is required by Supabase project settings
    if (data.session) {
      router.push('/ideas');
      router.refresh();
    } else {
      setSuccessMessage('Account created! Please check your email inbox to confirm your account.');
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" description="Free to start. Your first idea is a minute away.">
      <div className="flex flex-col gap-5">
        <Suspense fallback={null}>
          <AuthUrlError />
        </Suspense>
        <GoogleSignInButton label="Sign up with Google" disabled={loading} />
        <OrDivider label="or with email" />
        <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="py-2.5 bg-primary/10 border-primary/40 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-xs">{successMessage}</AlertDescription>
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              className="h-10"
              placeholder="Type it again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="lg" className="mt-1 h-10 w-full font-semibold" disabled={loading}>
            {loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
