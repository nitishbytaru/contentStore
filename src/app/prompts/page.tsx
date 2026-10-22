'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPrompts, 
  fetchPromptCategories, 
  createPromptCategory, 
  addPrompt, 
  updatePrompt, 
  deletePrompt, 
  setSelectedCategory, 
  PromptItem 
} from '@/store/slices/promptsSlice';
import { AppDispatch, RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Copy, Plus, Trash2, Edit, Save, X, AlertCircle, Search, Loader2, 
  ChevronDown, FolderPlus, Tag 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PromptsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    items: prompts, 
    categories, 
    selectedCategory, 
    loading, 
    categoriesLoading, 
    error, 
    hasFetched, 
    actionLoading 
  } = useSelector((state: RootState) => state.prompts);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Category creation modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchPrompts());
    }
    dispatch(fetchPromptCategories());
  }, [dispatch, hasFetched]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Prompt copied to clipboard!');
  };

  const handleOpenCreate = () => {
    dispatch(fetchPromptCategories());
    const initialCat = selectedCategory !== 'all' 
      ? selectedCategory 
      : (categories.find(c => c.toLowerCase() === 'general') || categories[0] || 'General');
    setNewCategory(initialCat);
    setIsCreating(true);
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
      setNewCategory(selectedCategory !== 'all' ? selectedCategory : 'General');
    }
  };

  const handleStartEdit = (p: PromptItem) => {
    dispatch(fetchPromptCategories());
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditCategory(p.category || 'General');
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
      toast.success('Changes saved successfully!');
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

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setCreatingCategoryLoading(true);
    try {
      const result = await dispatch(createPromptCategory(trimmed));
      if (createPromptCategory.fulfilled.match(result)) {
        toast.success(`Category "${result.payload}" created!`);
        if (isCreating) {
          setNewCategory(result.payload);
        }
        if (editingId) {
          setEditCategory(result.payload);
        }
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
      } else {
        toast.error((result.payload as string) || 'Failed to create category');
      }
    } finally {
      setCreatingCategoryLoading(false);
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

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === 'all' || 
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prompt Library</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!isCreating && (
            <div className="relative flex-1 sm:w-48 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search prompts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 h-9 text-xs sm:text-sm"
              />
            </div>
          )}

          {/* Category Dropdown and Create Category option */}
          {!isCreating && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  if (val === '__create_new__') {
                    setNewCategoryName('');
                    setIsCategoryModalOpen(true);
                  } else if (val) {
                    dispatch(setSelectedCategory(val));
                  }
                }}
              >
                <SelectTrigger className="h-9 min-w-[150px] sm:min-w-[180px] bg-background text-xs sm:text-sm font-medium">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories ({prompts.length})</SelectItem>
                  {categories.length > 0 && <SelectSeparator />}
                  {categories.map((cat) => {
                    const count = prompts.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
                    return (
                      <SelectItem key={cat} value={cat}>
                        {cat} {count > 0 ? `(${count})` : ''}
                      </SelectItem>
                    );
                  })}
                  <SelectSeparator />
                  <SelectItem value="__create_new__" className="text-primary font-medium">
                    + Create new category...
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Near the dropdown: option to create a new category */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewCategoryName('');
                  setIsCategoryModalOpen(true);
                }}
                className="h-9 px-2.5 text-xs font-medium gap-1.5 shrink-0 hover:border-primary/50"
                title="Create a new category"
              >
                <FolderPlus className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">New Category</span>
              </Button>
            </div>
          )}

          {!isCreating && (
            <Button onClick={handleOpenCreate} className="h-9 shrink-0 text-xs sm:text-sm font-medium shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Add Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Active Category Filter Indicator */}
      {selectedCategory !== 'all' && !isCreating && (
        <div className="flex items-center gap-2 text-xs bg-muted/40 border border-border/60 rounded-lg px-3 py-1.5">
          <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">Category:</span>
          <span className="font-medium text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px]">
            {selectedCategory}
          </span>
          <span className="text-muted-foreground">({filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''})</span>
          <button
            onClick={() => dispatch(setSelectedCategory('all'))}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Show all
          </button>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Prompt</CardTitle>
            <CardDescription className="text-xs">
              Select or create a category, then enter your prompt details.
            </CardDescription>
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryName('');
                        setIsCategoryModalOpen(true);
                      }}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" /> New category
                    </button>
                  </div>
                  <div>
                    <Select
                      value={newCategory}
                      onValueChange={(val) => {
                        if (val === '__create_new__') {
                          setNewCategoryName('');
                          setIsCategoryModalOpen(true);
                        } else if (val) {
                          setNewCategory(val);
                        }
                      }}
                      disabled={actionLoading || categoriesLoading}
                    >
                      <SelectTrigger className="w-full h-9 bg-background text-sm">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="__create_new__" className="text-primary font-medium">
                          + Create new category...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prompt Content</label>
                <Textarea 
                  placeholder="Paste your prompt template here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)}
                  className="min-h-[120px] max-h-[320px] overflow-y-auto overscroll-contain"
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

      {/* Prompt Cards Grid */}
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
            {searchQuery 
              ? 'No prompts match your search.' 
              : selectedCategory !== 'all' 
              ? `No prompts found in category "${selectedCategory}".` 
              : 'No prompts yet. Start building your library!'}
          </p>
          {selectedCategory !== 'all' && !searchQuery ? (
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => dispatch(setSelectedCategory('all'))} variant="outline" size="sm">
                View all prompts
              </Button>
              <Button onClick={handleOpenCreate} size="sm">
                Add prompt to {selectedCategory}
              </Button>
            </div>
          ) : !searchQuery ? (
            <Button onClick={handleOpenCreate} variant="outline" size="sm">
              Create your first prompt
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map(p => (
            <Card key={p.id} className="flex flex-col hover:border-border transition-colors">
              {editingId === p.id ? (
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                  
                  <div>
                    <Select
                      value={editCategory}
                      onValueChange={(val) => {
                        if (val === '__create_new__') {
                          setNewCategoryName('');
                          setIsCategoryModalOpen(true);
                        } else if (val) {
                          setEditCategory(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-9 bg-background text-sm">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="__create_new__" className="text-primary font-medium">
                          + Create new category...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)} 
                    className="flex-1 min-h-[120px] max-h-[300px] overflow-y-auto overscroll-contain"
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
                        <button
                          type="button"
                          onClick={() => dispatch(setSelectedCategory(p.category))}
                          className="inline-block px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer transition-colors"
                          title={`Filter by category "${p.category}"`}
                        >
                          {p.category}
                        </button>
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

      {/* Create New Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold">Create New Category</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Organize your prompts together under this category.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateCategorySubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category Name</label>
              <Input
                placeholder="e.g. YouTube Shorts, Threads, Midjourney..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={creatingCategoryLoading}
                autoFocus
                maxLength={50}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                disabled={creatingCategoryLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newCategoryName.trim() || creatingCategoryLoading}
              >
                {creatingCategoryLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                )}
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
