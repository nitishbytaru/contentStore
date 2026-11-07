'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/StatusPage';
import './globals.css';

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the whole
 * document, so it brings its own <html>/<body>, global styles and the app's dark theme.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full bg-background text-foreground antialiased">
      <body className="min-h-full font-sans">
        <title>Something went wrong · ContentStore</title>
        <main className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <StatusPage
            className="min-h-screen"
            tone="destructive"
            icon={AlertTriangle}
            title="ContentStore hit a problem"
            description="Something went wrong while loading the app. Your data is safe. Try again, or reload the page."
            details={error.digest ? `Error reference: ${error.digest}` : undefined}
            actions={
              <>
                {/* Full reload: the app shell itself failed, so client navigation may not work. */}
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload page
                </Button>
                <Button onClick={() => retry()}>
                  <RotateCcw data-icon="inline-start" />
                  Try again
                </Button>
              </>
            }
          />
        </main>
      </body>
    </html>
  );
}
