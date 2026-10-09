'use client';
import { useState } from 'react';
import { useArticle } from './ArticleContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Save, MessageCircle, Video, Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ArticleDetail({ activeTab }: { activeTab: 'article' | 'xPost' | 'videoPrompt' }) {
  const { article, loading, error, updateArticle } = useArticle();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<{ id: string; type: 'article' | 'xPost' | 'videoPrompt'; content: string } | null>(null);

  if (loading) return <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>;
  if (error || !article) return <div className="text-red-500">Failed to load entry</div>;

  const handleSaveEdit = async () => {
    if (!editingContent) return;
    try {
      setProcessingId(article.id + 'edit');
      let action = 'edit_article';
      if (editingContent.type === 'xPost') action = 'edit_x_post';
      if (editingContent.type === 'videoPrompt') action = 'edit_video_prompt';

      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id, action, content: editingContent.content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      updateArticle(json.data);
      setEditingContent(null);
    } catch (err: any) {
      alert('Failed to save edit: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content || '');
    alert('Copied to clipboard!');
  };

  const handleDeleteArticle = async () => {
    if (!confirm('Are you sure you want to delete this entire entry?')) return;
    try {
      setProcessingId('delete_article');
      const res = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push('/articles');
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearField = async (action: string) => {
    if (!confirm('Are you sure you want to clear this content?')) return;
    try {
      setProcessingId('clear_' + action);
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id, action, content: '' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      updateArticle(json.data);
    } catch (err: any) {
      alert('Failed to clear content: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const renderEditableContent = (type: 'article' | 'xPost' | 'videoPrompt', contentString: string) => {
    const isEditing = editingContent?.type === type;
    if (isEditing) {
      return (
        <div className="p-4 space-y-4">
          <Textarea 
            value={editingContent.content}
            onChange={(e) => setEditingContent({ id: article.id, type, content: e.target.value })}
            className="min-h-[400px] font-mono text-sm bg-background"
            placeholder={`Enter your ${type} content here...`}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingContent(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={processingId === article.id + 'edit'}>
              {processingId === article.id + 'edit' ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div 
        className="p-6 prose prose-invert max-w-none prose-sm sm:prose-base min-h-[400px] max-h-[600px] overflow-y-auto cursor-text bg-background/50 hover:bg-muted/10 transition-colors"
        onClick={() => setEditingContent({ id: article.id, type, content: contentString || '' })}
        title="Click to edit manually"
      >
        {!contentString ? (
          <div className="text-muted-foreground italic h-full flex items-center justify-center">
            Click to add content
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-foreground/90 font-medium">
            {contentString}
          </pre>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden shadow-md animate-in fade-in duration-500">
      {activeTab === 'article' && (
        <div className="flex flex-col">
          <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
            <Button variant="ghost" size="sm" onClick={handleDeleteArticle} disabled={processingId === 'delete_article'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4 mr-1" /> {processingId === 'delete_article' ? 'Deleting...' : 'Delete Entry'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(article.articleContent)}>
              <Copy className="h-4 w-4 mr-1" /> Copy Content
            </Button>
          </div>
          {renderEditableContent('article', article.articleContent)}
        </div>
      )}

      {activeTab === 'xPost' && (
        <div className="flex flex-col">
          <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
            {article.xPostContent && (
              <Button variant="ghost" size="sm" onClick={() => handleClearField('edit_x_post')} disabled={processingId === 'clear_edit_x_post'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4 mr-1" /> Delete Thread
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleCopy(article.xPostContent)}>
              <Copy className="h-4 w-4 mr-1 text-foreground" /> Copy Thread
            </Button>
          </div>
          {renderEditableContent('xPost', article.xPostContent)}
        </div>
      )}

      {activeTab === 'videoPrompt' && (
        <div className="flex flex-col">
          <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
            {article.videoPromptContent && (
              <Button variant="ghost" size="sm" onClick={() => handleClearField('edit_video_prompt')} disabled={processingId === 'clear_edit_video_prompt'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4 mr-1" /> Delete Script
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleCopy(article.videoPromptContent)}>
              <Copy className="h-4 w-4 mr-1 text-foreground" /> Copy Script
            </Button>
          </div>
          {renderEditableContent('videoPrompt', article.videoPromptContent)}
        </div>
      )}
    </Card>
  );
}
