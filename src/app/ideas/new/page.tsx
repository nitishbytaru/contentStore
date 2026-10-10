'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { addIdea } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';

export default function NewIdeaPage() {
  const [idea, setIdea] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isSubmitting = useSelector((state: RootState) => state.ideas.actionLoading);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    const result = await dispatch(addIdea(idea.trim()));
    if (addIdea.rejected.match(result)) {
      toast.error('Failed to create idea: ' + (result.payload as string));
    } else {
      toast.success('Idea created successfully!');
      router.push(`/ideas/${result.payload.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <Card className="border-primary/20 shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Create New Todo</CardTitle>
          <CardDescription className="text-base md:text-lg mt-1 md:mt-2 text-muted-foreground/80">
            What's your next big idea? Write it down and start building.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <Input 
              value={idea} 
              onChange={(e) => setIdea(e.target.value)} 
              placeholder="e.g. Write a comprehensive guide on Next.js 15..." 
              disabled={isSubmitting}
              className="text-base py-4 sm:text-lg sm:py-6 focus-visible:ring-primary/50 bg-background/50"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!idea.trim() || isSubmitting} 
              className="w-full py-4 text-base sm:py-6 sm:text-lg shadow-lg hover:shadow-primary/25 transition-all"
            >
              {isSubmitting ? <Skeleton className="h-5 w-5 rounded-full mr-2" /> : null}
              {isSubmitting ? 'Creating...' : 'Create Idea & Open Planner'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
