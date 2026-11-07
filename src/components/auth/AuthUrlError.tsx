'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Shows the `?error=` message that /auth/callback adds when a sign-in (e.g. Google) fails. */
export function AuthUrlError() {
  const error = useSearchParams().get('error');
  if (!error) return null;
  return (
    <Alert variant="destructive" className="py-2.5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-xs">{error}</AlertDescription>
    </Alert>
  );
}
