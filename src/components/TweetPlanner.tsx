'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setSearchQuery, setTypeFilter, setStatusFilter 
} from '@/store/slices/ideasSlice';
import { 
  useGetIdeasQuery, 
  useUpdateIdeaMutation, 
  useDeleteIdeaMutation 
} from '@/store/api/ideasApi';
import { Idea } from '@/types';
import { RootState, AppDispatch } from '@/store';
import { matchesIdeaFilters } from '@/utils/ideaStatus';
import { MobileTimer } from '@/components/MobileTimer';
import {
  IdeaCard,
  IdeaFilterBar,
  IdeaSearchBar,
  IdeaListSkeleton,
  IdeaEmptyState,
} from './ideas';

export function IdeasPlanner() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    searchQuery, 
    typeFilter = 'all', 
    statusFilter = 'pending' 
  } = useSelector((state: RootState) => state.ideas);

  const { data: ideas = [], isLoading: loading, error: queryError } = useGetIdeasQuery();
  const [deleteIdea] = useDeleteIdeaMutation();
  const [updateIdea] = useUpdateIdeaMutation();

  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editIdeaText, setEditIdeaText] = useState('');
  const [actionIdeaId, setActionIdeaId] = useState<string | null>(null);

  const error = queryError
    ? ('status' in queryError ? JSON.stringify(queryError.data) : (queryError as any).message || 'Failed to load ideas')
    : null;

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this idea and all its associated data (articles, chats, and embeddings)?')) return;
    setActionIdeaId(ideaId);
    try {
      await deleteIdea(ideaId).unwrap();
      toast.success('Idea and all associated data deleted');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to delete idea');
    } finally {
      setActionIdeaId(null);
    }
  };

  const handleEditIdea = async (ideaId: string) => {
    if (!editIdeaText.trim()) return;
    setActionIdeaId(ideaId);
    try {
      await updateIdea({ ideaId, idea: editIdeaText.trim() }).unwrap();
      toast.success('Changes saved successfully!');
      setEditingIdeaId(null);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to update idea');
    } finally {
      setActionIdeaId(null);
    }
  };

  const handleCopyIdea = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const sortedIdeas = useMemo(() => {
    return [...ideas]
      .filter((i) => !searchQuery.trim() || i.idea.toLowerCase().includes(searchQuery.toLowerCase()))
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
    return sortedIdeas.filter((idea) => matchesIdeaFilters(idea, typeFilter, statusFilter));
  }, [sortedIdeas, typeFilter, statusFilter]);

  const filterCounts = useMemo(() => {
    return {
      status: {
        pending: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'all', 'pending')).length,
        completed: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'all', 'completed')).length,
      },
      type: {
        all: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'all', statusFilter)).length,
        research: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'research', statusFilter)).length,
        article: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'article', statusFilter)).length,
        video: sortedIdeas.filter((idea) => matchesIdeaFilters(idea, 'video', statusFilter)).length,
      },
    };
  }, [sortedIdeas, statusFilter]);

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
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <IdeaSearchBar
        searchQuery={searchQuery}
        onSearchChange={(query) => dispatch(setSearchQuery(query))}
        onClearSearch={() => dispatch(setSearchQuery(''))}
        onNewIdea={() => router.push('/ideas/new')}
      />

      {/* Mobile-Only Session Timer */}
      <MobileTimer />

      {/* Two-Group Filter Controls */}
      <IdeaFilterBar
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        filterCounts={filterCounts}
        loading={loading}
        onTypeFilterChange={(type) => dispatch(setTypeFilter(type))}
        onStatusFilterChange={(status) => dispatch(setStatusFilter(status))}
      />

      {/* Status Bar / Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <span className="font-semibold text-foreground">{currentFilteredIdeas.length}</span>{' '}
          {typeFilter === 'all' ? '' : `${typeFilter} `}
          {statusFilter} ideas
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
          <IdeaListSkeleton />
        ) : currentFilteredIdeas.length === 0 ? (
          <IdeaEmptyState message={getEmptyMessage()} />
        ) : (
          currentFilteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.ideaId}
              idea={idea}
              isEditing={editingIdeaId === idea.ideaId}
              editText={editIdeaText}
              isActionLoading={Boolean(actionIdeaId && actionIdeaId === idea.ideaId)}
              onStartEdit={(targetIdea) => {
                setEditingIdeaId(targetIdea.ideaId);
                setEditIdeaText(targetIdea.idea);
              }}
              onCancelEdit={() => setEditingIdeaId(null)}
              onEditTextChange={setEditIdeaText}
              onSaveEdit={handleEditIdea}
              onCopyIdea={handleCopyIdea}
              onDeleteIdea={handleDeleteIdea}
            />
          ))
        )}
      </div>
    </div>
  );
}

export const TweetPlanner = IdeasPlanner;
