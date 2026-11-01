'use client';

import { useState } from 'react';
import { 
  useGetPromptsQuery, 
  useAddPromptMutation, 
  useUpdatePromptMutation, 
  useDeletePromptMutation,
  useEnhancePromptMutation,
} from '@/store/api/promptsApi';
import { PromptItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, Plus, Trash2, Edit, Save, X, AlertCircle, Search, Loader2, Sparkles, Check 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PromptsPage() {
  const { data: prompts = [], isLoading: loading, error: queryError } = useGetPromptsQuery();
  
  const [addPromptMutation, { isLoading: isAddingPrompt }] = useAddPromptMutation();
  const [updatePromptMutation, { isLoading: isUpdatingPrompt }] = useUpdatePromptMutation();
  const [deletePromptMutation, { isLoading: isDeletingPrompt }] = useDeletePromptMutation();
  const [enhancePromptMutation] = useEnhancePromptMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [enhancingId, setEnhancingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const actionLoading = isAddingPrompt || isUpdatingPrompt || isDeletingPrompt || !!enhancingId;

  const handleEnhance = async (id: string) => {
    setEnhancingId(id);
    try {
      const updated = await enhancePromptMutation({ id }).unwrap();
      if (editingId === id) {
        setEditContent(updated.content);
      }
      toast.success('Prompt enhanced and saved with AI!');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to enhance prompt with AI');
    } finally {
      setEnhancingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await addPromptMutation({ 
        title: newTitle.trim(), 
        content: newContent.trim(), 
      }).unwrap();
      toast.success('Prompt created successfully!');
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to create prompt');
    }
  };

  const handleStartEdit = (p: PromptItem) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;
    try {
      await updatePromptMutation({
        id: editingId,
        title: editTitle.trim(),
        content: editContent.trim(),
      }).unwrap();
      toast.success('Prompt updated successfully!');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to update prompt');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await deletePromptMutation(id).unwrap();
      toast.success('Prompt deleted');
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || 'Failed to delete prompt');
    }
  };

  const error = queryError
    ? ('status' in queryError ? JSON.stringify(queryError.data) : (queryError as any).message || 'Failed to load prompts')
    : null;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Prompts</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const filteredPrompts = prompts.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) || 
      p.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Prompt Library</h1>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isCreating && (
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search prompts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 h-9 text-xs sm:text-sm bg-muted/40 border-border/60 focus-visible:bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {!isCreating && (
            <Button onClick={handleOpenCreate} className="h-9 shrink-0 text-xs sm:text-sm font-medium shadow-xs gap-1.5">
              <Plus className="w-4 h-4" /> Add Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Create New Prompt
            </CardTitle>
            <CardDescription className="text-xs">
              Add a prompt template to use when writing or rewriting articles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input 
                  placeholder="e.g. Technical Deep-Dive, Engaging Storyteller, Punchy Summary..." 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  disabled={actionLoading}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prompt Content</label>
                <Textarea 
                  placeholder="Write your prompt instructions here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="min-h-[140px] max-h-[360px] text-sm overflow-y-auto overscroll-contain"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreating(false)} 
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newTitle.trim() || !newContent.trim() || actionLoading}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Save Prompt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prompt Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-20 w-full rounded-md" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPrompts.length === 0 && !isCreating ? (
        <div className="border border-dashed border-border rounded-lg py-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {searchQuery 
              ? 'No prompts match your search.' 
              : 'No prompts yet. Start building your library!'}
          </p>
          {searchQuery ? (
            <Button onClick={() => setSearchQuery('')} variant="outline" size="sm">
              Clear search
            </Button>
          ) : (
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Create your first prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map(p => (
            <Card key={p.id} className="flex flex-col hover:border-primary/30 transition-all duration-150">
              {editingId === p.id ? (
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Title</label>
                    <Input 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      placeholder="Title" 
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  
                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-[11px] font-medium text-muted-foreground">Content</label>
                    <Textarea 
                      value={editContent} 
                      onChange={e => setEditContent(e.target.value)} 
                      className="flex-1 min-h-[120px] max-h-[300px] text-xs font-mono overflow-y-auto overscroll-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEnhance(p.id)} 
                      disabled={enhancingId === p.id}
                      className="h-8 text-xs font-medium gap-1.5 text-primary hover:bg-primary/10 border-primary/30"
                    >
                      {enhancingId === p.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Enhancing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Enhance with AI</span>
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim() || !editContent.trim()} className="h-8 text-xs">
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                    <CardTitle className="text-sm font-semibold truncate leading-tight flex-1" title={p.title}>
                      {p.title}
                    </CardTitle>
                    <Button 
                      size="icon-xs" 
                      variant="ghost" 
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" 
                      onClick={() => handleCopy(p.id, p.content)} 
                      title="Copy Prompt"
                    >
                      {copiedId === p.id ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 pt-1 pb-3">
                    <div className="bg-muted/40 p-3 rounded-md text-xs text-muted-foreground line-clamp-6 whitespace-pre-wrap font-mono leading-relaxed border border-border/40">
                      {p.content}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-between gap-1 border-t border-border/40 mt-auto pt-2.5">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEnhance(p.id)} 
                      disabled={enhancingId === p.id}
                      className="h-7 px-2 text-xs font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/25 hover:border-primary/50 shadow-xs"
                      title="Enhance this prompt using AI"
                    >
                      {enhancingId === p.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Enhancing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span>Enhance with AI</span>
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleStartEdit(p)} 
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(p.id)} 
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
