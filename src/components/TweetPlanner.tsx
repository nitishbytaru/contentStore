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
import { cn } from 'cn';
import { getIdeaPublishStatus, isIdeaPending } from '@/lib/ideaStatus';

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

  const filteredIdeas = ideas
    .filter(i => i.idea.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeB - timeA;
    });
  
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

  const renderIdeaCard = (idea: Idea, _idx?: number) => {
    const publishStatus = getIdeaPublishStatus(idea);
    const hasBaseArticle = Boolean(idea.baseArticle && idea.baseArticle.trim().length > 0);
    const cardClasses = cn(
      "transition-all group border-l-4 rounded-xl hover:shadow-sm border-border/80",
      publishStatus.borderClass,
      publishStatus.bgClass
    );

    return (
      <Card key={idea.id} className={cardClasses}>
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-3 min-h-[104px]">
          {editingId === idea.id ? (
            <div className="flex items-center gap-2 w-full py-1">
              <Input 
                value={editIdeaText} 
                onChange={(e) => setEditIdeaText(e.target.value)} 
                className="flex-1 h-9 text-sm"
                autoFocus
                disabled={actionLoading && actionItemId === idea.id}
              />
              <Button 
                size="sm" 
                onClick={() => handleEditIdea(idea.id)} 
                disabled={actionLoading && actionItemId === idea.id}
                className="h-9 px-3 gap-1 shrink-0"
              >
                {actionLoading && actionItemId === idea.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 shrink-0" 
                onClick={() => setEditingId(null)} 
                disabled={actionLoading && actionItemId === idea.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {/* Row 1: Title (left) & Status Badge (right) */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Link 
                    href={`/ideas/${idea.id}`}
                    className="text-sm sm:text-base font-medium leading-snug hover:underline cursor-pointer transition-colors hover:text-primary block line-clamp-2"
                    title={idea.idea}
                  >
                    {idea.idea}
                  </Link>
                  {!hasBaseArticle && (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        <FileText className="w-3 h-3 shrink-0 opacity-80" />
                        No Base Article
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                    publishStatus.badgeClass
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      publishStatus.dotClass,
                      publishStatus.status === 'untouched' ? "animate-pulse" : ""
                    )} />
                    {publishStatus.label}
                  </span>
                </div>
              </div>

              {/* Row 2: Metadata (Date) on left & Action buttons on right */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">Created {new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
                
                {actionLoading && actionItemId === idea.id ? (
                  <div className="flex items-center px-2 shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" 
                      onClick={() => handleCopyIdea(idea.idea)}
                      title="Copy Idea"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" 
                      onClick={() => { setEditingId(idea.id); setEditIdeaText(idea.idea); }}
                      title="Edit Idea"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
                      onClick={() => handleDeleteIdea(idea.id)}
                      title="Delete Idea"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </>
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
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
        <div className="relative flex-1 sm:max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search ideas..." 
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="pl-9 h-9 w-full"
          />
        </div>
        <Button 
          onClick={() => router.push('/ideas/new')} 
          className="shrink-0 h-9 w-9 sm:w-auto p-0 sm:px-4"
          title="Create New Idea"
          aria-label="Create New Idea"
        >
          <Plus className="h-4 w-4 sm:mr-2 shrink-0" />
          <span className="hidden sm:inline">Create New Idea</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => dispatch(setActiveTab(val))} className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex h-auto p-1 bg-muted/60 rounded-xl border border-border/50 gap-1 mb-6">
          {[
            { id: 'all', label: 'All', count: filteredIdeas.length, icon: List },
            { id: 'pending', label: 'Pending', count: pendingIdeas.length, icon: Clock },
            { id: 'articles', label: 'Articles', count: eligibleForArticles.length, icon: FileText },
            { id: 'videos', label: 'Videos', count: eligibleForVideos.length, icon: Video },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-1.5 sm:px-3.5 py-2 sm:py-1.5 text-xs sm:text-sm font-medium transition-all min-w-0 w-full",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5 shrink-0 hidden sm:inline-block" />
                <span>{tab.label}</span>
                {!loading && (
                  <span 
                    className={cn(
                      "ml-1 sm:ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none shrink-0",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-foreground/10 text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
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
