'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';

export default function NewIdeaPage() {
  const [idea, setIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      toast.success('Idea created successfully!');
      router.push(`/ideas/${json.data.id}`);
    } catch (err: any) {
      toast.error('Failed to create idea: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <Card className="border-primary/20 shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Create New Todo</CardTitle>
          <CardDescription className="text-lg mt-2 text-muted-foreground/80">
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
              className="text-lg py-6 focus-visible:ring-primary/50 bg-background/50"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!idea.trim() || isSubmitting} 
              className="w-full py-6 text-lg shadow-lg hover:shadow-primary/25 transition-all"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isSubmitting ? 'Creating...' : 'Create Idea & Open Planner'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
