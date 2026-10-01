'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Sparkles, Copy, Save, Send, FileText, MessageCircle, Video } from 'lucide-react';

interface Article {
  id: string;
  originalTopic: string;
  articleContent: string;
  xPostContent: string;
  videoPromptContent: string;
  createdAt: string;
  updatedAt: string;
}

export function ArticleGenerator() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<{ [key: string]: string }>({});
  const [editingContent, setEditingContent] = useState<{ id: string; type: 'article' | 'xPost' | 'videoPrompt'; content: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/articles');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch articles');
      setArticles(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setArticles((prev) => [json.data, ...prev]);
      setTopic('');
    } catch (err: any) {
      alert('Failed to generate article: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async (id: string, action: string, typeKey: string) => {
    const promptKey = `${id}-${typeKey}`;
    const prompt = customPrompt[promptKey] || '';
    
    // We only block if iterating without prompt where it might be required? Actually no, generate doesn't require a prompt.
    // If it's an iteration, we probably should have a prompt.
    if (action.includes('iterate') && !prompt.trim()) return;

    try {
      setProcessingId(id + action);
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, customPrompt: prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setArticles((prev) => prev.map((a) => (a.id === id ? json.data : a)));
      setCustomPrompt({ ...customPrompt, [promptKey]: '' });
    } catch (err: any) {
      alert(`Failed to ${action}: ` + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingContent || editingContent.id !== id) return;

    try {
      setProcessingId(id + 'edit');
      let action = 'edit_article';
      if (editingContent.type === 'xPost') action = 'edit_x_post';
      if (editingContent.type === 'videoPrompt') action = 'edit_video_prompt';

      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, content: editingContent.content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setArticles((prev) => prev.map((a) => (a.id === id ? json.data : a)));
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

  const handlePromptChange = (id: string, typeKey: string, val: string) => {
    setCustomPrompt({ ...customPrompt, [`${id}-${typeKey}`]: val });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Articles</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const renderEditableContent = (article: Article, type: 'article' | 'xPost' | 'videoPrompt', contentString: string) => {
    const isEditing = editingContent?.id === article.id && editingContent.type === type;
    
    if (isEditing) {
      return (
        <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <Textarea 
            value={editingContent.content}
            onChange={(e) => setEditingContent({ id: article.id, type, content: e.target.value })}
            className="min-h-[400px] font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingContent(null)}>Cancel</Button>
            <Button 
              onClick={() => handleSaveEdit(article.id)}
              disabled={processingId === article.id + 'edit'}
            >
              {processingId === article.id + 'edit' ? 'Saving...' : 'Save Changes'}
              {!(processingId === article.id + 'edit') && <Save className="ml-2 h-4 w-4" />}
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
    <div className="space-y-8">
      <header className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-fuchsia-500/10 rounded-full text-fuchsia-500">
            <Sparkles className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-400">
          AI Content Hub
        </h2>
        <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
          From rough ideas to structured articles, viral X threads, and video scripts. All powered by Gemini.
        </p>
      </header>

      <Card className="border-fuchsia-500/20 shadow-lg bg-fuchsia-500/5">
        <CardHeader>
          <CardTitle>Draft New Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste your rough notes or description here..."
              disabled={isGenerating || loading}
              className="min-h-[150px] text-lg bg-background"
            />
            <Button 
              type="submit" 
              disabled={!topic.trim() || isGenerating || loading} 
              className="w-full py-6 text-md bg-fuchsia-600 hover:bg-fuchsia-700"
            >
              {isGenerating ? 'Generating with AI...' : 'Generate Base Article'}
              {!isGenerating && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Your AI Content</h3>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No content generated yet.
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id} className="overflow-hidden border-border transition-all hover:border-fuchsia-500/30 shadow-md">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-lg">
                  <div className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2">
                    <span className="font-bold text-foreground">Prompt:</span> {article.originalTopic}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <Tabs defaultValue="article" className="w-full">
                <div className="border-b border-border bg-muted/10 px-4 pt-2">
                  <TabsList className="bg-transparent space-x-2">
                    <TabsTrigger value="article" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-fuchsia-500 rounded-none pb-3">
                      <FileText className="w-4 h-4 mr-2" />
                      Article
                    </TabsTrigger>
                    <TabsTrigger value="xpost" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none pb-3">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      X Thread
                    </TabsTrigger>
                    <TabsTrigger value="video" className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none pb-3">
                      <Video className="w-4 h-4 mr-2" />
                      Video Prompt
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* --- ARTICLE TAB --- */}
                <TabsContent value="article" className="m-0 border-0 outline-none">
                  <div className="flex justify-end p-2 pb-0 bg-background/50">
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(article.articleContent)}>
                      <Copy className="h-4 w-4 mr-1" /> Copy Article
                    </Button>
                  </div>
                  {renderEditableContent(article, 'article', article.articleContent)}
                  <CardFooter className="bg-muted/20 border-t border-border p-4">
                    <div className="flex w-full gap-3">
                      <Input 
                        placeholder="Refine Article with AI (e.g. 'Make it shorter')"
                        value={customPrompt[`${article.id}-article`] || ''}
                        onChange={(e) => handlePromptChange(article.id, 'article', e.target.value)}
                        disabled={processingId === article.id + 'iterate_article'}
                      />
                      <Button 
                        variant="secondary" 
                        onClick={() => handleAction(article.id, 'iterate_article', 'article')}
                        disabled={!(customPrompt[`${article.id}-article`]?.trim()) || processingId === article.id + 'iterate_article'}
                      >
                        {processingId === article.id + 'iterate_article' ? 'Iterating...' : 'Iterate'}
                        {!(processingId === article.id + 'iterate_article') && <Send className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </CardFooter>
                </TabsContent>

                {/* --- X POST TAB --- */}
                <TabsContent value="xpost" className="m-0 border-0 outline-none">
                  {!article.xPostContent ? (
                    <div className="p-8 text-center space-y-4">
                      <MessageCircle className="w-12 h-12 text-blue-500/50 mx-auto" />
                      <h4 className="text-lg font-medium">No X Thread Generated Yet</h4>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Turn this article into a viral X (Twitter) thread. Add an optional custom prompt to guide the AI style.
                      </p>
                      <div className="max-w-md mx-auto flex gap-2">
                        <Input 
                          placeholder="Optional: 'Make it controversial', 'Use lots of emojis'"
                          value={customPrompt[`${article.id}-xpost`] || ''}
                          onChange={(e) => handlePromptChange(article.id, 'xpost', e.target.value)}
                        />
                        <Button 
                          onClick={() => handleAction(article.id, 'generate_x_post', 'xpost')}
                          disabled={processingId === article.id + 'generate_x_post'}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {processingId === article.id + 'generate_x_post' ? 'Generating...' : 'Generate Thread'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end p-2 pb-0 bg-background/50">
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(article.xPostContent)}>
                          <Copy className="h-4 w-4 mr-1 text-blue-500" /> Copy Thread
                        </Button>
                      </div>
                      {renderEditableContent(article, 'xPost', article.xPostContent)}
                      <CardFooter className="bg-blue-950/10 border-t border-border p-4">
                        <div className="flex w-full gap-3">
                          <Input 
                            placeholder="Refine Thread with AI (e.g. 'Make the hook punchier')"
                            value={customPrompt[`${article.id}-xpost`] || ''}
                            onChange={(e) => handlePromptChange(article.id, 'xpost', e.target.value)}
                            disabled={processingId === article.id + 'generate_x_post'}
                          />
                          <Button 
                            variant="secondary" 
                            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
                            onClick={() => handleAction(article.id, 'generate_x_post', 'xpost')}
                            disabled={processingId === article.id + 'generate_x_post'}
                          >
                            {processingId === article.id + 'generate_x_post' ? 'Regenerating...' : 'Regenerate'}
                            {!(processingId === article.id + 'generate_x_post') && <Sparkles className="ml-2 h-4 w-4" />}
                          </Button>
                        </div>
                      </CardFooter>
                    </>
                  )}
                </TabsContent>

                {/* --- VIDEO PROMPT TAB --- */}
                <TabsContent value="video" className="m-0 border-0 outline-none">
                  {!article.videoPromptContent ? (
                    <div className="p-8 text-center space-y-4">
                      <Video className="w-12 h-12 text-red-500/50 mx-auto" />
                      <h4 className="text-lg font-medium">No Video Prompt Generated Yet</h4>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Convert this article into a high-retention script and video prompt for Shorts/Reels/TikTok.
                      </p>
                      <div className="max-w-md mx-auto flex gap-2">
                        <Input 
                          placeholder="Optional: 'Focus on 3 main tips', 'Make it cinematic'"
                          value={customPrompt[`${article.id}-video`] || ''}
                          onChange={(e) => handlePromptChange(article.id, 'video', e.target.value)}
                        />
                        <Button 
                          onClick={() => handleAction(article.id, 'generate_video_prompt', 'video')}
                          disabled={processingId === article.id + 'generate_video_prompt'}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {processingId === article.id + 'generate_video_prompt' ? 'Generating...' : 'Generate Script'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end p-2 pb-0 bg-background/50">
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(article.videoPromptContent)}>
                          <Copy className="h-4 w-4 mr-1 text-red-500" /> Copy Video Prompt
                        </Button>
                      </div>
                      {renderEditableContent(article, 'videoPrompt', article.videoPromptContent)}
                      <CardFooter className="bg-red-950/10 border-t border-border p-4">
                        <div className="flex w-full gap-3">
                          <Input 
                            placeholder="Refine Script with AI (e.g. 'Make it under 60 seconds')"
                            value={customPrompt[`${article.id}-video`] || ''}
                            onChange={(e) => handlePromptChange(article.id, 'video', e.target.value)}
                            disabled={processingId === article.id + 'generate_video_prompt'}
                          />
                          <Button 
                            variant="secondary" 
                            className="bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300"
                            onClick={() => handleAction(article.id, 'generate_video_prompt', 'video')}
                            disabled={processingId === article.id + 'generate_video_prompt'}
                          >
                            {processingId === article.id + 'generate_video_prompt' ? 'Regenerating...' : 'Regenerate'}
                            {!(processingId === article.id + 'generate_video_prompt') && <Sparkles className="ml-2 h-4 w-4" />}
                          </Button>
                        </div>
                      </CardFooter>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
