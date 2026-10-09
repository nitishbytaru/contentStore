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
import { Copy, Plus, Trash2, Edit, Save, X, Lightbulb } from 'lucide-react';
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
    return <div className="p-8 text-center text-red-500">Error loading prompts: {error}</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Lightbulb className="w-8 h-8 mr-3" /> Prompt Library
          </h1>
          <p className="text-muted-foreground mt-1">Manage your reusable prompts for tweets, video generation, and more.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="shadow-lg hover:shadow-primary/25 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add Prompt
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-xl bg-card">
          <CardHeader>
            <CardTitle>Create New Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="e.g. Technical Thread Hook..." 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    disabled={actionLoading}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    placeholder="e.g. Tweets, Video, Midjourney..." 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)} 
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Content</label>
                <Textarea 
                  placeholder="Paste your prompt template here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="min-h-[150px]"
                  disabled={actionLoading}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={actionLoading}>Cancel</Button>
                <Button type="submit" disabled={!newTitle.trim() || !newContent.trim() || actionLoading}>
                  {actionLoading ? <Skeleton className="h-4 w-4 mr-2 rounded-full" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Prompt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : prompts.length === 0 && !isCreating ? (
        <div className="text-center p-12 border border-dashed rounded-xl border-border bg-muted/20">
          <p className="text-muted-foreground text-lg mb-4">No prompts yet. Start building your library!</p>
          <Button onClick={() => setIsCreating(true)} variant="outline">Create your first prompt</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map(p => (
            <Card key={p.id} className="flex flex-col border-primary/10 hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
              {editingId === p.id ? (
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                  <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category" />
                  <Textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)} 
                    className="flex-1 min-h-[150px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim() || !editContent.trim()}>Save</Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg line-clamp-1" title={p.title}>{p.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {p.category}
                        </span>
                      </CardDescription>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(p.content)} title="Copy Prompt">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="bg-muted/30 p-3 rounded-md text-sm text-foreground/80 line-clamp-6 whitespace-pre-wrap font-mono">
                      {p.content}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(p)} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
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
