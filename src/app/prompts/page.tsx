'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrompts, addPrompt, updatePrompt, deletePrompt, PromptItem } from '@/store/slices/promptsSlice';
import { AppDispatch, RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Plus, Trash2, Edit, Save, X, AlertCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PromptsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: prompts, loading, error, hasFetched, actionLoading } = useSelector((state: RootState) => state.prompts);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchPrompts());
    }
  }, [dispatch, hasFetched]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Prompt copied to clipboard!');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const result = await dispatch(addPrompt({ 
      title: newTitle.trim(), 
      content: newContent.trim(), 
      category: newCategory.trim() || 'General' 
    }));
    if (addPrompt.rejected.match(result)) {
      toast.error('Failed to create prompt');
    } else {
      toast.success('Prompt created!');
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('');
    }
  };

  const handleStartEdit = (p: PromptItem) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditCategory(p.category);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;
    const result = await dispatch(updatePrompt({
      id: editingId,
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory.trim() || 'General'
    }));
    if (updatePrompt.rejected.match(result)) {
      toast.error('Failed to update prompt');
    } else {
      toast.success('Prompt updated!');
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    const result = await dispatch(deletePrompt(id));
    if (deletePrompt.rejected.match(result)) {
      toast.error('Failed to delete prompt');
    } else {
      toast.success('Prompt deleted');
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Prompts</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prompt Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your reusable prompts for content generation.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          {!isCreating && (
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search prompts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> Add Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input 
                    placeholder="e.g. Technical Thread Hook..." 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    disabled={actionLoading}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <Input 
                    placeholder="e.g. Tweets, Video, Midjourney..." 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)} 
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prompt Content</label>
                <Textarea 
                  placeholder="Paste your prompt template here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="min-h-[120px]"
                  disabled={actionLoading}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} disabled={actionLoading}>Cancel</Button>
                <Button type="submit" size="sm" disabled={!newTitle.trim() || !newContent.trim() || actionLoading}>
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Save Prompt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prompt Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-16 rounded-full" />
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
            {searchQuery ? 'No prompts match your search.' : 'No prompts yet. Start building your library!'}
          </p>
          {!searchQuery && <Button onClick={() => setIsCreating(true)} variant="outline" size="sm">Create your first prompt</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map(p => (
            <Card key={p.id} className="flex flex-col hover:border-border transition-colors">
              {editingId === p.id ? (
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                  <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category" />
                  <Textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)} 
                    className="flex-1 min-h-[120px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim() || !editContent.trim()}>Save</Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium truncate" title={p.title}>{p.title}</CardTitle>
                      <CardDescription className="mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {p.category}
                        </span>
                      </CardDescription>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(p.content)} title="Copy Prompt">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    <div className="bg-muted/40 p-3 rounded-md text-xs text-muted-foreground line-clamp-6 whitespace-pre-wrap font-mono leading-relaxed">
                      {p.content}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(p)} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
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
