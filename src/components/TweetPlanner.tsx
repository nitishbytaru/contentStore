'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, Trash2, Edit, Save, X, Loader2, Copy, FileText, Video, List, Plus } from 'lucide-react';
import { toast } from "sonner";

interface Idea {
  id: string;
  idea: string;
  status: 'pending' | 'posted';
  datePosted: string;
  createdAt: string;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedX: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
  baseArticle: string;
  tweets: string;
  videoScript: string;
  mediumArticle: string;
  youtubeScript: string;
}

export function TweetPlanner() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIdeaText, setEditIdeaText] = useState('');
  const [actionItemId, setActionItemId] = useState<string | null>(null);

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

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    try {
      setActionItemId(id);
      const res = await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete idea');
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionItemId(null);
    }
  };

  const handleEditIdea = async (id: string) => {
    if (!editIdeaText.trim()) return;
    try {
      setActionItemId(id);
      const res = await fetch('/api/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, idea: editIdeaText.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update idea');
      const json = await res.json();
      setIdeas((prev) => prev.map((idea) => idea.id === id ? { ...idea, idea: json.data.idea } : idea));
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionItemId(null);
    }
  };

  const handleCopyIdea = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const pendingIdeas = ideas.filter(i => i.status !== 'posted');
  const eligibleForMedium = ideas.filter(i => !i.publishedMedium);
  const eligibleForYoutube = ideas.filter(i => !i.publishedYoutube);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Ideas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const renderIdeaCard = (idea: Idea) => (
    <Card key={idea.id} className="transition-all hover:shadow-md hover:border-primary/50 group bg-card">
      <CardContent className="flex items-center space-x-4 p-5">
        <div className="flex-1 space-y-1">
          {editingId === idea.id ? (
            <div className="flex items-center space-x-2">
              <Input 
                value={editIdeaText} 
                onChange={(e) => setEditIdeaText(e.target.value)} 
                className="flex-1"
                autoFocus
                disabled={actionItemId === idea.id}
              />
              <Button size="icon" variant="ghost" onClick={() => handleEditIdea(idea.id)} disabled={actionItemId === idea.id}>
                {actionItemId === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} disabled={actionItemId === idea.id}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <>
              <Link 
                href={`/ideas/${idea.id}`}
                className="text-lg font-semibold leading-none hover:underline cursor-pointer transition-all hover:text-primary block"
              >
                {idea.idea}
              </Link>
              <p className="text-xs text-muted-foreground/80 font-medium">
                Created {new Date(idea.createdAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
        {actionItemId === idea.id && editingId !== idea.id ? (
          <div className="flex space-x-2 px-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : editingId !== idea.id && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <Button size="icon" variant="ghost" onClick={() => handleCopyIdea(idea.idea)}>
              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditingId(idea.id); setEditIdeaText(idea.idea); }}>
              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteIdea(idea.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button asChild size="lg" className="shadow-md hover:shadow-primary/30 transition-all rounded-full px-6">
          <Link href="/ideas/new">
            <Plus className="mr-2 h-5 w-5" />
            Create New Todo
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="inline-flex w-full sm:w-auto h-auto bg-muted/30 p-1.5 rounded-full mb-8 flex-wrap justify-center sm:justify-start gap-1 border border-border/50">
          <TabsTrigger 
            value="pending" 
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-medium text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
            Pending ({loading ? '...' : pendingIdeas.length})
          </TabsTrigger>
          <TabsTrigger 
            value="medium" 
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-medium text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Medium Eligible ({loading ? '...' : eligibleForMedium.length})
          </TabsTrigger>
          <TabsTrigger 
            value="youtube" 
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-medium text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
            YouTube Eligible ({loading ? '...' : eligibleForYoutube.length})
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-medium text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <List className="w-4 h-4 mr-2" />}
            All ({loading ? '...' : ideas.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <Card className="border-dashed bg-muted/5">
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading...</p>
              </CardContent>
            </Card>
          ) : pendingIdeas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending ideas. Time to brainstorm!
              </CardContent>
            </Card>
          ) : (
            pendingIdeas.map(renderIdeaCard)
          )}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {loading ? (
            <Card className="border-dashed bg-muted/5">
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading...</p>
              </CardContent>
            </Card>
          ) : eligibleForMedium.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Everything is published on Medium!
              </CardContent>
            </Card>
          ) : (
            eligibleForMedium.map(renderIdeaCard)
          )}
        </TabsContent>

        <TabsContent value="youtube" className="space-y-4">
          {loading ? (
            <Card className="border-dashed bg-muted/5">
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading...</p>
              </CardContent>
            </Card>
          ) : eligibleForYoutube.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Everything is published on YouTube!
              </CardContent>
            </Card>
          ) : (
            eligibleForYoutube.map(renderIdeaCard)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <Card className="border-dashed bg-muted/5">
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">Loading...</p>
              </CardContent>
            </Card>
          ) : ideas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No ideas yet. Time to brainstorm!
              </CardContent>
            </Card>
          ) : (
            ideas.map(renderIdeaCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
