'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Article } from './ArticleContext';

export function ArticleGenerator() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/articles');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch articles');
      setArticles(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setIsCreating(true);
      
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      const articleId = json.data.id;
      router.push(`/articles/${articleId}/basearticle`);
    } catch (err: any) {
      alert('Failed to create content: ' + err.message);
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Content Hub
        </h2>
        <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
          Store your rough ideas, articles, X threads, and video scripts.
        </p>
      </header>

      <Card className="border-border shadow-lg bg-muted/5">
        <CardHeader className="pb-4">
          <CardTitle>Create New Content Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic or rough notes here..."
              disabled={isCreating || loading}
              className="min-h-[150px] text-lg bg-background"
            />
            <Button 
              type="submit" 
              disabled={!topic.trim() || isCreating || loading} 
              className="w-full py-6 text-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? 'Creating...' : 'Create Entry'}
              {!isCreating && <Plus className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Your Content Entries</h3>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No content entries yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}/basearticle`}>
                <Card className="overflow-hidden border-border transition-all hover:border-foreground/50 hover:shadow-lg shadow-md cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
                      <span className="font-bold text-muted-foreground mr-2">Topic:</span> 
                      {article.originalTopic}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
