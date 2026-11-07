'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/StatusPage';

/**
 * Catches unexpected errors anywhere below the root layout. The header stays usable,
 * so the user can retry or navigate away.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <>
      <title>Something went wrong · ContentStore</title>
      <StatusPage
        tone="destructive"
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error stopped this page from loading. Your saved ideas and content are safe. Try again, or go back to your ideas."
        details={error.digest ? `Error reference: ${error.digest}` : undefined}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/ideas" />}>
              <Lightbulb data-icon="inline-start" />
              Go to my ideas
            </Button>
            <Button onClick={() => retry()}>
              <RotateCcw data-icon="inline-start" />
              Try again
            </Button>
          </>
        }
      />
    </>
  );
}
