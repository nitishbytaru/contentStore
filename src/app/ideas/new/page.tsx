'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
    <div className="max-w-lg mx-auto pt-8">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Ideas
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create New Idea</CardTitle>
          <CardDescription>
            What's your next big idea? Write it down and start building.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input 
              value={idea} 
              onChange={(e) => setIdea(e.target.value)} 
              placeholder="e.g. Write a comprehensive guide on Next.js 15..." 
              disabled={isSubmitting}
              className="text-sm"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!idea.trim() || isSubmitting} 
              className="w-full"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Idea & Open Editor'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
