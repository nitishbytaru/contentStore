'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, Clock, Trash2, Edit, Save, X, Copy, FileText, Video, 
  List, Plus, Search, Loader2, CheckCircle, ExternalLink,
  Layers, BookOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchIdeas, deleteIdea, updateIdea, addIdea, 
  setSearchQuery, setTypeFilter, setStatusFilter 
} from '@/store/slices/ideasSlice';
import { Idea, IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { RootState, AppDispatch } from '@/store';
import { cn } from 'cn';
import { 
  getIdeaPublishStatus, 
  matchesIdeaFilters 
} from '@/lib/ideaStatus';
import { MobileTimer } from '@/components/MobileTimer';

export function IdeasPlanner() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    items: ideas, 
    loading, 
    error, 
    actionLoading, 
    hasFetched, 
    searchQuery, 
    typeFilter = 'all', 
    statusFilter = 'pending' 
  } = useSelector((state: RootState) => state.ideas);

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

  const sortedIdeas = useMemo(() => {
    return [...ideas]
      .filter(i => !searchQuery.trim() || i.idea.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      });
  }, [ideas, searchQuery]);

  const currentFilteredIdeas = useMemo(() => {
    return sortedIdeas.filter(idea => matchesIdeaFilters(idea, typeFilter, statusFilter));
  }, [sortedIdeas, typeFilter, statusFilter]);

  const filterCounts = useMemo(() => {
    return {
      status: {
        pending: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'all', 'pending')).length,
        completed: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'all', 'completed')).length,
      },
      type: {
        all: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'all', statusFilter)).length,
        research: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'research', statusFilter)).length,
        article: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'article', statusFilter)).length,
        video: sortedIdeas.filter(idea => matchesIdeaFilters(idea, 'video', statusFilter)).length,
      }
    };
  }, [sortedIdeas, statusFilter]);

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
                  {idea.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {!hasBaseArticle && (
                      <Link
                        href={`/ideas/${idea.id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-colors"
                      >
                        <FileText className="w-3 h-3 shrink-0 opacity-80" />
                        Needs Research
                      </Link>
                    )}
                    {Boolean(idea.eligibleMedium || idea.eligibleSubstack) && (() => {
                      const isPub = Boolean(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack);
                      const isDraft = Boolean(idea.articleDraftedDone || (idea.mediumArticle && idea.mediumArticle.trim()));
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                          isPub
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : isDraft
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                              : "bg-muted text-muted-foreground border-border/70"
                        )}>
                          <FileText className="w-3 h-3 shrink-0" />
                          Article: {isPub ? 'Published ✓' : isDraft ? 'Drafted' : 'Drafting'}
                        </span>
                      );
                    })()}
                    {Boolean(idea.eligibleYoutube || idea.eligibleInstagram) && (() => {
                      const isUploaded = Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram);
                      let stageLabel = 'Scripting';
                      if (isUploaded) stageLabel = 'Uploaded ✓';
                      else if (idea.videoEditingDone) stageLabel = 'Editing Done';
                      else if (idea.videoShootingDone) stageLabel = 'Shooting Done';

                      return (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                          isUploaded
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : (idea.videoEditingDone || idea.videoShootingDone)
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 font-semibold"
                              : "bg-muted text-muted-foreground border-border/70"
                        )}>
                          <Video className="w-3 h-3 shrink-0" />
                          Video: {stageLabel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                    publishStatus.badgeClass
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      publishStatus.dotClass
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
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Open Editor"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Editor</span>
                    </Link>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = (message: string, actionButton?: React.ReactNode) => (
    <div className="border border-dashed border-border rounded-lg py-12 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionButton}
    </div>
  );

  const typeOptions: Array<{ id: IdeaTypeFilter; label: string; icon: any; count: number }> = [
    { id: 'all', label: 'All', icon: Layers, count: filterCounts.type.all },
    { id: 'research', label: 'Research', icon: BookOpen, count: filterCounts.type.research },
    { id: 'article', label: 'Article', icon: FileText, count: filterCounts.type.article },
    { id: 'video', label: 'Video', icon: Video, count: filterCounts.type.video },
  ];

  const statusOptions: Array<{ id: IdeaStatusFilter; label: string; icon: any; count: number }> = [
    { id: 'pending', label: 'Pending', icon: Clock, count: filterCounts.status.pending },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: filterCounts.status.completed },
  ];

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No ideas match your search for "${searchQuery}".`;
    }
    if (statusFilter === 'completed') {
      if (typeFilter === 'video') return 'No completed video ideas yet. Complete and upload a video to see it here.';
      if (typeFilter === 'article') return 'No completed article ideas yet. Publish an article to see it here.';
      if (typeFilter === 'research') return 'No ideas with completed research yet.';
      return 'No completed ideas yet. Once an idea is published and marked complete, it will appear here.';
    } else {
      if (typeFilter === 'video') return 'No video scripts currently in progress. Open an idea and choose "Yes" for video to start scripting!';
      if (typeFilter === 'article') return 'No articles currently in progress. Open an idea and choose "Yes" for article to start drafting!';
      if (typeFilter === 'research') return 'No ideas pending research right now. Click "New Idea" to get started!';
      return 'No pending ideas right now. Click "New Idea" to start brainstorming!';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
        <div className="relative flex-1 sm:max-w-md min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search ideas..." 
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="pl-9 h-10 w-full text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-primary shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button 
          onClick={() => router.push('/ideas/new')} 
          className="shrink-0 h-10 px-4 text-xs sm:text-sm font-semibold gap-1.5 shadow-xs cursor-pointer"
          title="Open Dedicated Idea Creator"
        >
          <Plus className="h-4 w-4" />
          <span>New Idea</span>
        </Button>
      </div>

      {/* Mobile-Only Session Timer */}
      <MobileTimer />

      {/* Two-Group Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl border border-border/75 bg-muted/20 backdrop-blur-xs">
        {/* Group 1: Content Type (All, Research, Article, Video) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1.5 pr-0.5">
            Content:
          </span>
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = typeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => dispatch(setTypeFilter(opt.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold ring-1 ring-primary/40"
                    : "bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{opt.label}</span>
                {!loading && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-tight shrink-0",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-foreground/10 text-muted-foreground"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Group 2: Status (Pending, Completed) */}
        <div className="flex items-center gap-1 sm:gap-1.5 justify-start md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border/60">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1.5 pr-0.5">
            Status:
          </span>
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = statusFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => dispatch(setStatusFilter(opt.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-foreground text-background shadow-xs font-semibold ring-1 ring-foreground/40"
                    : "bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{opt.label}</span>
                {!loading && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-semibold leading-tight shrink-0",
                      isSelected
                        ? "bg-background/20 text-background"
                        : "bg-foreground/10 text-muted-foreground"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Bar / Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <span className="font-semibold text-foreground">{currentFilteredIdeas.length}</span> {typeFilter === 'all' ? '' : typeFilter + ' '}{statusFilter} ideas
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => dispatch(setSearchQuery(''))}
            className="text-primary hover:underline cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Ideas Card List */}
      <div className="space-y-3">
        {loading ? (
          renderSkeletons()
        ) : currentFilteredIdeas.length === 0 ? (
          renderEmptyState(getEmptyMessage())
        ) : (
          currentFilteredIdeas.map((idea, idx) => renderIdeaCard(idea, idx))
        )}
      </div>
    </div>
  );
}

export const TweetPlanner = IdeasPlanner;
