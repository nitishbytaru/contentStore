'use client';
import { useState, useEffect, useRef } from 'react';
import { useArticle } from './ArticleContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Save, Send, MessageCircle, Video, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ArticleDetail({ activeTab }: { activeTab: 'article' | 'xPost' | 'videoPrompt' }) {
  const { article, loading, error, updateArticle } = useArticle();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<{ [key: string]: string }>({});
  const [editingContent, setEditingContent] = useState<{ id: string; type: 'article' | 'xPost' | 'videoPrompt'; content: string } | null>(null);
  const autoGenId = useRef<string | null>(null);

  useEffect(() => {
    if (!article || autoGenId.current === article.id) return;
    if (article.xPostContent && article.videoPromptContent) {
      autoGenId.current = article.id;
      return;
    }

    const autoGenerate = async () => {
      autoGenId.current = article.id;
      
      try {
        if (!article.xPostContent) {
          setProcessingId(article.id + 'generate_x_post');
          const resX = await fetch('/api/articles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: article.id, action: 'generate_x_post', customPrompt: '' }),
          });
          const jsonX = await resX.json();
          if (resX.ok) updateArticle(jsonX.data);
        }
      } catch (e) {}

      try {
        if (!article.videoPromptContent) {
          setProcessingId(article.id + 'generate_video_prompt');
          const resV = await fetch('/api/articles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: article.id, action: 'generate_video_prompt', customPrompt: '' }),
          });
          const jsonV = await resV.json();
          if (resV.ok) updateArticle(jsonV.data);
        }
      } catch (e) {}

      setProcessingId(null);
    };

    autoGenerate();
  }, [article, updateArticle]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>;
  if (error || !article) return <div className="text-red-500">Failed to load article</div>;

  const handleAction = async (action: string, typeKey: string) => {
    const promptKey = `${article.id}-${typeKey}`;
    const prompt = customPrompt[promptKey] || '';
    if (action.includes('iterate') && !prompt.trim()) return;

    try {
      setProcessingId(article.id + action);
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id, action, customPrompt: prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      updateArticle(json.data);
      setCustomPrompt({ ...customPrompt, [promptKey]: '' });
    } catch (err: any) {
      alert(`Failed to ${action}: ` + err.message);
    } finally {
      setProcessingId(null);
    }
  };

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
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  };

  const handleDeleteArticle = async () => {
    if (!confirm('Are you sure you want to delete this entire article?')) return;
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
        className="p-6 prose prose-invert max-w-none prose-sm sm:prose-base h-[400px] overflow-y-auto cursor-text bg-background/50 hover:bg-muted/10 transition-colors"
        onClick={() => setEditingContent({ id: article.id, type, content: contentString })}
        title="Click to edit manually"
      >
        <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-foreground/90 font-medium">
          {contentString}
        </pre>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden shadow-md animate-in fade-in duration-500">
      <CardHeader className="bg-muted/30 border-b border-border">
        <CardTitle className="text-lg">
          <div className="text-sm font-medium text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Prompt:</span> {article.originalTopic}
          </div>
        </CardTitle>
      </CardHeader>
      
      {activeTab === 'article' && (
        <div className="flex flex-col">
          <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
            <Button variant="ghost" size="sm" onClick={handleDeleteArticle} disabled={processingId === 'delete_article'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4 mr-1" /> {processingId === 'delete_article' ? 'Deleting...' : 'Delete Article'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(article.articleContent)}>
              <Copy className="h-4 w-4 mr-1" /> Copy Article
            </Button>
          </div>
          {renderEditableContent('article', article.articleContent)}
          <CardFooter className="bg-muted/20 border-t border-border p-4">
            <div className="flex w-full gap-3">
              <Input 
                placeholder="Refine Article with AI (e.g. 'Make it shorter')"
                value={customPrompt[`${article.id}-article`] || ''}
                onChange={(e) => setCustomPrompt({...customPrompt, [`${article.id}-article`]: e.target.value})}
                disabled={processingId === article.id + 'iterate_article'}
              />
              <Button 
                variant="secondary" 
                onClick={() => handleAction('iterate_article', 'article')}
                disabled={!(customPrompt[`${article.id}-article`]?.trim()) || processingId === article.id + 'iterate_article'}
              >
                {processingId === article.id + 'iterate_article' ? 'Iterating...' : 'Iterate'}
                {!(processingId === article.id + 'iterate_article') && <Send className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </div>
      )}

      {activeTab === 'xPost' && (
        <div className="flex flex-col">
          {!article.xPostContent ? (
            <div className="p-8 text-center space-y-4">
              <MessageCircle className="w-12 h-12 text-foreground/50 mx-auto" />
              <h4 className="text-lg font-medium">No X Thread Generated Yet</h4>
              <div className="max-w-md mx-auto flex gap-2">
                <Input 
                  placeholder="Optional: 'Use lots of emojis'"
                  value={customPrompt[`${article.id}-xpost`] || ''}
                  onChange={(e) => setCustomPrompt({...customPrompt, [`${article.id}-xpost`]: e.target.value})}
                />
                <Button 
                  onClick={() => handleAction('generate_x_post', 'xpost')}
                  disabled={processingId === article.id + 'generate_x_post'}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {processingId === article.id + 'generate_x_post' ? 'Generating...' : 'Generate Thread'}
                  {!(processingId === article.id + 'generate_x_post') && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleClearField('edit_x_post')} disabled={processingId === 'clear_edit_x_post'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Thread
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(article.xPostContent)}>
                  <Copy className="h-4 w-4 mr-1 text-foreground" /> Copy Thread
                </Button>
              </div>
              {renderEditableContent('xPost', article.xPostContent)}
              <CardFooter className="bg-muted/10 border-t border-border p-4">
                <div className="flex w-full gap-3">
                  <Input 
                    placeholder="Refine Thread with AI"
                    value={customPrompt[`${article.id}-xpost`] || ''}
                    onChange={(e) => setCustomPrompt({...customPrompt, [`${article.id}-xpost`]: e.target.value})}
                    disabled={processingId === article.id + 'generate_x_post'}
                  />
                  <Button 
                    variant="secondary" 
                    className="bg-muted text-foreground hover:bg-muted/80"
                    onClick={() => handleAction('generate_x_post', 'xpost')}
                    disabled={processingId === article.id + 'generate_x_post'}
                  >
                    {processingId === article.id + 'generate_x_post' ? 'Regenerating...' : 'Regenerate'}
                    {!(processingId === article.id + 'generate_x_post') && <Sparkles className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </div>
      )}

      {activeTab === 'videoPrompt' && (
        <div className="flex flex-col">
          {!article.videoPromptContent ? (
            <div className="p-8 text-center space-y-4">
              <Video className="w-12 h-12 text-foreground/50 mx-auto" />
              <h4 className="text-lg font-medium">No Video Script Generated Yet</h4>
              <div className="max-w-md mx-auto flex gap-2">
                <Input 
                  placeholder="Optional: 'Focus on 3 main tips'"
                  value={customPrompt[`${article.id}-video`] || ''}
                  onChange={(e) => setCustomPrompt({...customPrompt, [`${article.id}-video`]: e.target.value})}
                />
                <Button 
                  onClick={() => handleAction('generate_video_prompt', 'video')}
                  disabled={processingId === article.id + 'generate_video_prompt'}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {processingId === article.id + 'generate_video_prompt' ? 'Generating...' : 'Generate Script'}
                  {!(processingId === article.id + 'generate_video_prompt') && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end p-2 pb-0 bg-background/50 gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleClearField('edit_video_prompt')} disabled={processingId === 'clear_edit_video_prompt'} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Script
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(article.videoPromptContent)}>
                  <Copy className="h-4 w-4 mr-1 text-foreground" /> Copy Script
                </Button>
              </div>
              {renderEditableContent('videoPrompt', article.videoPromptContent)}
              <CardFooter className="bg-muted/10 border-t border-border p-4">
                <div className="flex w-full gap-3">
                  <Input 
                    placeholder="Refine Script with AI"
                    value={customPrompt[`${article.id}-video`] || ''}
                    onChange={(e) => setCustomPrompt({...customPrompt, [`${article.id}-video`]: e.target.value})}
                    disabled={processingId === article.id + 'generate_video_prompt'}
                  />
                  <Button 
                    variant="secondary" 
                    className="bg-muted text-foreground hover:bg-muted/80"
                    onClick={() => handleAction('generate_video_prompt', 'video')}
                    disabled={processingId === article.id + 'generate_video_prompt'}
                  >
                    {processingId === article.id + 'generate_video_prompt' ? 'Regenerating...' : 'Regenerate'}
                    {!(processingId === article.id + 'generate_video_prompt') && <Sparkles className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
