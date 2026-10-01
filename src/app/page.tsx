'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Database } from 'lucide-react';

type ContentItem = Record<string, any>;

export default function Home() {
  const [data, setData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/content');
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch content');
        }

        setData(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden relative">
      <main className="relative z-10 container mx-auto px-6 py-20 max-w-7xl">
        <header className="mb-16 text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Content Store
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Your dynamic data, beautifully synced with Google Spreadsheets.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Connection Error</AlertTitle>
            <AlertDescription className="mt-2 text-sm leading-relaxed space-y-4">
              <p>{error}</p>
              <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-muted-foreground font-mono">
                <p>1. Copy .env.example to .env.local</p>
                <p>2. Fill in your Google Cloud service account details</p>
                <p>3. Share your Google Sheet with the service account email</p>
              </div>
            </AlertDescription>
          </Alert>
        ) : data.length === 0 ? (
          <Alert className="max-w-md mx-auto text-center border-dashed">
            <Database className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <AlertTitle className="text-xl">No Content Found</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Your Google Sheet is empty or hasn't been set up yet.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item, idx) => (
              <Card key={idx} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="flex flex-col space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {key}
                      </span>
                      <span className="text-sm text-foreground break-words">
                        {value || <span className="text-muted-foreground italic">Empty</span>}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
