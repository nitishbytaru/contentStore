'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { addIdea } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';

export default function NewIdeaPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isSubmitting = useSelector((state: RootState) => state.ideas.actionLoading);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const result = await dispatch(addIdea({ 
      idea: title.trim(), 
      description: description.trim() 
    }));
    if (addIdea.rejected.match(result)) {
      toast.error('Failed to create idea: ' + (result.payload as string));
    } else {
      toast.success('Idea created in Pending state!');
      // Redirect to the ideas page only
      router.push('/ideas');
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
                Add title and notes. Your idea will be created in the Pending queue.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. 5 system design patterns every senior dev should know..." 
                disabled={isSubmitting}
                className="text-sm h-10"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Add context, key bullet points, target audience, or research notes..." 
                disabled={isSubmitting}
                className="text-sm min-h-[140px] max-h-[360px] leading-relaxed resize-y"
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
                disabled={!title.trim() || isSubmitting} 
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
