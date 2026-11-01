'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';
import { useAddIdeaMutation } from '@/store/api/ideasApi';

export default function NewIdeaPage() {
  const [article, setArticle] = useState('');
  const router = useRouter();
  const [addIdea, { isLoading: isSubmitting }] = useAddIdeaMutation();

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
                Add the article. Your idea will be created in the Pending queue.
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
                onChange={(e) => setArticle(e.target.value)} 
                placeholder="e.g. 5 system design patterns every senior dev should know..." 
                disabled={isSubmitting}
                className="text-sm h-10"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.push('/ideas')} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!article.trim() || isSubmitting} 
                className="min-w-[140px] font-medium"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Creating Idea...' : 'Create Idea'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
