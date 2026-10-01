'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Sparkles, Copy, Save, Send } from 'lucide-react';

interface Article {
  id: string;
  originalTopic: string;
  articleContent: string;
  createdAt: string;
  updatedAt: string;
}

export function ArticleGenerator() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [iteratingId, setIteratingId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingContent, setEditingContent] = useState<{ id: string; content: string } | null>(null);

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

  const handleIterate = async (id: string) => {
    if (!customPrompt.trim()) return;

    try {
      setIteratingId(id);
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, customPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setArticles((prev) => prev.map((a) => (a.id === id ? json.data : a)));
      setCustomPrompt('');
    } catch (err: any) {
      alert('Failed to iterate: ' + err.message);
    } finally {
      setIteratingId(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingContent || editingContent.id !== id) return;

    try {
      setIteratingId(id);
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, currentContent: editingContent.content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setArticles((prev) => prev.map((a) => (a.id === id ? json.data : a)));
      setEditingContent(null);
    } catch (err: any) {
      alert('Failed to save edit: ' + err.message);
    } finally {
      setIteratingId(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
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

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-fuchsia-500/10 rounded-full text-fuchsia-500">
            <Sparkles className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-400">
          AI Article Generator
        </h2>
        <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
          Paste your rough ideas, descriptions, or bullet points, and Gemini will craft a perfectly structured markdown article for you.
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
              {isGenerating ? 'Generating with AI...' : 'Generate Article'}
              {!isGenerating && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Your Articles</h3>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No articles generated yet.
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id} className="overflow-hidden border-border transition-all hover:border-fuchsia-500/30">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-lg flex justify-between items-start gap-4">
                  <div className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    <span className="font-bold text-foreground">Prompt:</span> {article.originalTopic}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(article.articleContent)}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {editingContent?.id === article.id ? (
                  <div className="p-4 space-y-4">
                    <Textarea 
                      value={editingContent.content}
                      onChange={(e) => setEditingContent({ id: article.id, content: e.target.value })}
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEditingContent(null)}>Cancel</Button>
                      <Button 
                        onClick={() => handleSaveEdit(article.id)}
                        disabled={iteratingId === article.id}
                      >
                        {iteratingId === article.id ? 'Saving...' : 'Save Changes'}
                        {!iteratingId && <Save className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="p-6 prose prose-invert max-w-none prose-sm sm:prose-base h-[400px] overflow-y-auto cursor-text bg-background/50 hover:bg-muted/10 transition-colors"
                    onClick={() => setEditingContent({ id: article.id, content: article.articleContent })}
                    title="Click to edit manually"
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-foreground/90 font-medium">
                      {article.articleContent}
                    </pre>
                  </div>
                )}
              </CardContent>

              <CardFooter className="bg-muted/20 border-t border-border p-4">
                <div className="flex w-full gap-3">
                  <Input 
                    placeholder="Refine with AI (e.g. 'Make it shorter', 'Add a catchy title')"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={iteratingId === article.id}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => handleIterate(article.id)}
                    disabled={!customPrompt.trim() || iteratingId === article.id}
                  >
                    {iteratingId === article.id ? 'Iterating...' : 'Iterate'}
                    {!iteratingId && <Send className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
