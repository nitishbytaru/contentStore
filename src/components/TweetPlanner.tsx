'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, MessageCircle, CheckCircle2, Clock } from 'lucide-react';

interface Idea {
  id: string;
  idea: string;
  status: 'pending' | 'posted';
  datePosted: string;
  createdAt: string;
}

export function TweetPlanner() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newIdea, setNewIdea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ideas');
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch ideas');

      setIdeas(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: newIdea.trim() }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setIdeas((prev) => [...prev, json.data]);
      setNewIdea('');
    } catch (err: any) {
      alert('Failed to add idea: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPosted = async (id: string) => {
    try {
      setIdeas((prev) => 
        prev.map((idea) => 
          idea.id === id ? { ...idea, status: 'posted', datePosted: new Date().toISOString() } : idea
        )
      );

      const res = await fetch('/api/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
    } catch (err: any) {
      alert('Failed to update idea: ' + err.message);
      fetchIdeas();
    }
  };

  const pendingIdeas = ideas.filter(i => i.status !== 'posted');
  const postedIdeas = ideas.filter(i => i.status === 'posted');

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Ideas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tweet Planner
        </h2>
        <p className="text-lg text-muted-foreground font-medium">
          Jot down your single-liner ideas and track what you've posted.
        </p>
      </header>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle>New Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddIdea} className="flex space-x-3">
            <Input 
              value={newIdea} 
              onChange={(e) => setNewIdea(e.target.value)} 
              placeholder="e.g. Just deployed my first Next.js app! 🚀" 
              disabled={isSubmitting || loading}
              className="flex-1 text-lg py-6"
            />
            <Button type="submit" disabled={!newIdea.trim() || isSubmitting || loading} className="py-6 px-8 text-md">
              {isSubmitting ? 'Adding...' : 'Add Idea'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" />
            Pending Ideas ({pendingIdeas.length})
          </TabsTrigger>
          <TabsTrigger value="posted">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Posted ({postedIdeas.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : pendingIdeas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending ideas. Time to brainstorm!
              </CardContent>
            </Card>
          ) : (
            pendingIdeas.map((idea) => (
              <Card key={idea.id} className="transition-all hover:border-primary/50">
                <CardContent className="flex items-center space-x-4 p-6">
                  <Checkbox 
                    id={`idea-${idea.id}`} 
                    onCheckedChange={() => handleMarkAsPosted(idea.id)}
                    className="h-6 w-6 rounded-full"
                  />
                  <div className="flex-1 space-y-1">
                    <label 
                      htmlFor={`idea-${idea.id}`}
                      className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {idea.idea}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(idea.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="posted" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : postedIdeas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                You haven't posted any ideas yet.
              </CardContent>
            </Card>
          ) : (
            postedIdeas.map((idea) => (
              <Card key={idea.id} className="opacity-75 bg-muted/30">
                <CardContent className="flex items-center p-6">
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-medium line-through text-muted-foreground">
                      {idea.idea}
                    </p>
                    <p className="text-sm text-primary">
                      Posted on {new Date(idea.datePosted).toLocaleDateString()} at {new Date(idea.datePosted).toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
