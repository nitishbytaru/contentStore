'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';
import { useAddIdeaMutation, useFindSimilarIdeasMutation } from '@/store/api/ideasApi';

interface SimilarIdea {
  ideaId: string;
  title: string;
}

export default function NewIdeaPage() {
  const [article, setArticle] = useState('');
  const [matches, setMatches] = useState<SimilarIdea[] | null>(null);
  const router = useRouter();
  const [addIdea, { isLoading: isSubmitting }] = useAddIdeaMutation();
  const [findSimilarIdeas, { isLoading: isScanning }] = useFindSimilarIdeasMutation();

  const handleScan = async () => {
    if (!article.trim() || isScanning) return;

    try {
      const results = await findSimilarIdeas(article.trim()).unwrap();
      setMatches(results);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { error?: string } }).data?.error || '')
        : '';
      toast.error(message || 'Could not scan existing ideas. Nothing was created.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article.trim()) return;

    try {
      const createdIdea = await addIdea({
        idea: article.trim(),
      }).unwrap();
      toast.success('Idea created successfully!');
      router.push(`/ideas/${createdIdea.ideaId}`);
    } catch (err: any) {
      toast.error('Failed to create idea: ' + (err?.data?.error || err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-6 sm:pt-8">
      <Link 
        href="/ideas" 
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" /> Back to Ideas
      </Link>
      
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-xl">Create New Idea</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Add the article, then scan existing ideas before you create a new one.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Article <span className="text-destructive">*</span>
              </label>
              <Input 
                value={article} 
                onChange={(e) => {
                  setArticle(e.target.value);
                  setMatches(null);
                }} 
                placeholder="e.g. 5 system design patterns every senior dev should know..." 
                disabled={isSubmitting || isScanning}
                className="text-sm h-10"
                autoFocus
                required
              />
            </div>

            {matches && (
              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No existing ideas to compare yet. You can still create this one.
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-foreground">Similar ideas</p>
                    <ul className="space-y-2">
                      {matches.map((match) => (
                        <li
                          key={match.ideaId}
                          className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
                        >
                          <span className="text-sm leading-snug min-w-0">{match.title}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => router.push(`/ideas/${match.ideaId}`)}
                          >
                            Continue with this idea
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.push('/ideas')} 
                disabled={isSubmitting || isScanning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleScan}
                disabled={!article.trim() || isSubmitting || isScanning}
              >
                {isScanning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isScanning ? 'Scanning...' : 'Scan through ideas'}
              </Button>
              <Button 
                type="submit" 
                disabled={!article.trim() || isSubmitting || isScanning} 
                className="min-w-[140px] font-medium"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting
                  ? 'Creating Idea...'
                  : matches
                    ? 'Continue with new idea'
                    : 'Create Idea'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
