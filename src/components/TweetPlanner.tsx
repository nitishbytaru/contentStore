'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, Trash2, Edit, Save, X, Copy, FileText, Video, List, Plus, Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas, deleteIdea, updateIdea, Idea, setSearchQuery, setActiveTab } from '@/store/slices/ideasSlice';
import { RootState, AppDispatch } from '@/store';

const tabTriggerClass = "rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all";

export function TweetPlanner() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { items: ideas, loading, error, actionLoading, hasFetched, searchQuery, activeTab } = useSelector((state: RootState) => state.ideas);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIdeaText, setEditIdeaText] = useState('');
  const [actionItemId, setActionItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchIdeas());
    }
  }, [dispatch, hasFetched]);

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    setActionItemId(id);
    const result = await dispatch(deleteIdea(id));
    if (deleteIdea.rejected.match(result)) {
      toast.error(result.payload as string);
    }
    setActionItemId(null);
  };

  const handleEditIdea = async (id: string) => {
    if (!editIdeaText.trim()) return;
    setActionItemId(id);
    const result = await dispatch(updateIdea({ id, idea: editIdeaText.trim() }));
    if (updateIdea.rejected.match(result)) {
      toast.error(result.payload as string);
    } else {
      toast.success('Changes saved successfully!');
      setEditingId(null);
    }
    setActionItemId(null);
  };

  const handleCopyIdea = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filteredIdeas = ideas.filter(i => i.idea.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const isIdeaPending = (i: Idea) => {
    if (i.status === 'posted') return false;
    
    const isXSelected = i.eligibleX || i.ineligibleX;
    const isArticlesSelected = i.eligibleMedium || i.ineligibleMedium;
    const isVideosSelected = i.eligibleYoutube || i.ineligibleYoutube;
    
    const isChecklistFilled = isXSelected && isArticlesSelected && isVideosSelected;
    
    return !isChecklistFilled;
  };
  
  const pendingIdeas = filteredIdeas.filter(isIdeaPending);
  const eligibleForArticles = filteredIdeas.filter(i => (i.eligibleMedium || i.eligibleSubstack) && !(i.publishedMedium && i.publishedSubstack));
  const eligibleForVideos = filteredIdeas.filter(i => (i.eligibleYoutube || i.eligibleInstagram) && !(i.publishedYoutube && i.publishedInstagram));

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Ideas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

const UNTOUCHED_COLOR_PALETTES = [
  {
    border: 'border-l-amber-500 border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-amber-500/[0.03]',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  {
    border: 'border-l-purple-500 border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/[0.03]',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    dot: 'bg-purple-400',
  },
  {
    border: 'border-l-rose-500 border-rose-500/30 hover:border-rose-500/60',
    bg: 'bg-rose-500/[0.03]',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-400',
  },
  {
    border: 'border-l-cyan-500 border-cyan-500/30 hover:border-cyan-500/60',
    bg: 'bg-cyan-500/[0.03]',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    dot: 'bg-cyan-400',
  },
  {
    border: 'border-l-indigo-500 border-indigo-500/30 hover:border-indigo-500/60',
    bg: 'bg-indigo-500/[0.03]',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    dot: 'bg-indigo-400',
  },
  {
    border: 'border-l-fuchsia-500 border-fuchsia-500/30 hover:border-fuchsia-500/60',
    bg: 'bg-fuchsia-500/[0.03]',
    badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25',
    dot: 'bg-fuchsia-400',
  },
];

const getUntouchedColor = (id: string, index?: number) => {
  if (index !== undefined) {
    return UNTOUCHED_COLOR_PALETTES[index % UNTOUCHED_COLOR_PALETTES.length];
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return UNTOUCHED_COLOR_PALETTES[Math.abs(hash) % UNTOUCHED_COLOR_PALETTES.length];
};

const isIdeaTouched = (i: Idea): boolean => {
  const hasContent = Boolean(
    (i.baseArticle && i.baseArticle.trim().length > 0) ||
    (i.mediumArticle && i.mediumArticle.trim().length > 0) ||
    (i.youtubeScript && i.youtubeScript.trim().length > 0)
  );

  const hasChecklist = Boolean(
    i.eligibleX || i.ineligibleX || i.publishedX ||
    i.eligibleMedium || i.ineligibleMedium || i.publishedMedium ||
    i.eligibleSubstack || i.ineligibleSubstack || i.publishedSubstack ||
    i.eligibleYoutube || i.ineligibleYoutube || i.publishedYoutube ||
    i.eligibleInstagram || i.ineligibleInstagram || i.publishedInstagram ||
    i.status === 'posted'
  );

  return hasContent || hasChecklist;
};

const isIdeaCompleted = (i: Idea): boolean => {
  if (i.status === 'posted') return true;
  const isXDone = i.publishedX || i.ineligibleX;
  const isArticlesDone = (i.publishedMedium && i.publishedSubstack) || i.ineligibleMedium || i.ineligibleSubstack;
  const isVideosDone = (i.publishedYoutube && i.publishedInstagram) || i.ineligibleYoutube || i.ineligibleInstagram;
  return Boolean(isXDone && isArticlesDone && isVideosDone);
};

  const renderIdeaCard = (idea: Idea, idx = 0) => {
    const touched = isIdeaTouched(idea);
    const untouchedTheme = !touched ? getUntouchedColor(idea.id, idx) : null;
    const completed = isIdeaCompleted(idea);

    let cardClasses = "transition-all group border-l-4 ";
    if (!touched && untouchedTheme) {
      cardClasses += `${untouchedTheme.border} ${untouchedTheme.bg}`;
    } else if (completed) {
      cardClasses += "border-l-emerald-500 border-border/80 bg-emerald-500/[0.02] hover:border-emerald-500/50";
    } else {
      cardClasses += "border-l-sky-500 border-border/80 bg-sky-500/[0.02] hover:border-sky-500/50";
    }

    return (
      <Card key={idea.id} className={cardClasses}>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
          <div className="flex-1 min-w-0">
            {editingId === idea.id ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editIdeaText} 
                  onChange={(e) => setEditIdeaText(e.target.value)} 
                  className="flex-1"
                  autoFocus
                  disabled={actionLoading && actionItemId === idea.id}
                />
                <Button size="icon" variant="ghost" onClick={() => handleEditIdea(idea.id)} disabled={actionLoading && actionItemId === idea.id}>
                  {actionLoading && actionItemId === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} disabled={actionLoading && actionItemId === idea.id}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link 
                    href={`/ideas/${idea.id}`}
                    className="text-sm sm:text-base font-medium leading-tight hover:underline cursor-pointer transition-colors hover:text-primary block truncate max-w-xl"
                  >
                    {idea.idea}
                  </Link>
                  {!touched && untouchedTheme ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${untouchedTheme.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${untouchedTheme.dot} animate-pulse`} />
                      Untouched
                    </span>
                  ) : completed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(idea.createdAt).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
          {actionLoading && actionItemId === idea.id && editingId !== idea.id ? (
            <div className="flex items-center px-2 shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : editingId !== idea.id && (
            <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopyIdea(idea.idea)}>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(idea.id); setEditIdeaText(idea.idea); }}>
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteIdea(idea.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = (message: string) => (
    <div className="border border-dashed border-border rounded-lg py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search ideas..." 
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="pl-9 w-full"
          />
        </div>
        <Button onClick={() => router.push('/ideas/new')} className="w-full sm:w-auto shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Create New Idea
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => dispatch(setActiveTab(val))} className="w-full">
        <TabsList className="inline-flex w-full sm:w-auto h-auto bg-muted/50 p-1 rounded-lg mb-6 flex-wrap gap-0.5 border border-border/50">
          <TabsTrigger value="all" className={tabTriggerClass}>
            <List className="w-3.5 h-3.5 mr-1.5" />
            All{!loading && ` (${filteredIdeas.length})`}
          </TabsTrigger>
          <TabsTrigger value="pending" className={tabTriggerClass}>
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending{!loading && ` (${pendingIdeas.length})`}
          </TabsTrigger>
          <TabsTrigger value="articles" className={tabTriggerClass}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Articles{!loading && ` (${eligibleForArticles.length})`}
          </TabsTrigger>
          <TabsTrigger value="videos" className={tabTriggerClass}>
            <Video className="w-3.5 h-3.5 mr-1.5" />
            Videos{!loading && ` (${eligibleForVideos.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-3">
          {loading ? renderSkeletons()
            : filteredIdeas.length === 0
              ? renderEmptyState(searchQuery ? 'No ideas match your search.' : 'No ideas yet. Time to brainstorm!')
              : filteredIdeas.map((idea, idx) => renderIdeaCard(idea, idx))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {loading ? renderSkeletons()
            : pendingIdeas.length === 0
              ? renderEmptyState(searchQuery ? 'No ideas match your search.' : 'No pending ideas. Time to brainstorm!')
              : pendingIdeas.map((idea, idx) => renderIdeaCard(idea, idx))}
        </TabsContent>

        <TabsContent value="articles" className="space-y-3">
          {loading ? renderSkeletons()
            : eligibleForArticles.length === 0
              ? renderEmptyState(searchQuery ? 'No ideas match your search.' : 'Everything is published on Articles!')
              : eligibleForArticles.map((idea, idx) => renderIdeaCard(idea, idx))}
        </TabsContent>

        <TabsContent value="videos" className="space-y-3">
          {loading ? renderSkeletons()
            : eligibleForVideos.length === 0
              ? renderEmptyState(searchQuery ? 'No ideas match your search.' : 'Everything is published on Videos!')
              : eligibleForVideos.map((idea, idx) => renderIdeaCard(idea, idx))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
