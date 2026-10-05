'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Article } from './ArticleContext';
import { AIProcessingLoader, AIProcessingStep } from './ai/AIProcessingLoader';

const PROCESS_STEPS: AIProcessingStep[] = [
  { id: 'base', title: 'Drafting Base Article', description: 'Analyzing your topic and writing core content...' },
  { id: 'xpost', title: 'Generating X Thread', description: 'Crafting viral social media hooks...' },
  { id: 'video', title: 'Writing Video Script', description: 'Structuring for engagement and retention...' },
  { id: 'done', title: 'Finalizing Output', description: 'Preparing your AI content hub...' },
];

export function ArticleGenerator() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');

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
      setCurrentStepIndex(0);
      
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, model: selectedModel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      const articleId = json.data.id;

      setCurrentStepIndex(1);
      await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action: 'generate_x_post', customPrompt: '' }),
      });

      setCurrentStepIndex(2);
      await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, action: 'generate_video_prompt', customPrompt: '' }),
      });

      setCurrentStepIndex(3);
      router.push(`/articles/${articleId}/basearticle`);
    } catch (err: any) {
      alert('Failed to generate article: ' + err.message);
      setIsGenerating(false);
      setCurrentStepIndex(0);
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          AI Content Hub
        </h2>
        <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
          From rough ideas to structured articles, viral X threads, and video scripts. Powered by Gemini & Groq.
        </p>
      </header>

      <Card className="border-border shadow-lg bg-muted/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Draft New Article</CardTitle>
          <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val)} disabled={isGenerating || loading}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-3.8-flash">Gemini 3.8 Flash</SelectItem>
              <SelectItem value="gemini-3.7-flash">Gemini 3.7 Flash</SelectItem>
              <SelectItem value="gemini-flash-latest">Gemini Flash Latest</SelectItem>
              <SelectItem value="groq-llama-3.3-70b-versatile">Groq Llama 3.3 70B</SelectItem>
              <SelectItem value="openai/gpt-oss-20b">Groq GPT-OSS 20B</SelectItem>
            </SelectContent>
          </Select>
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
              className="w-full py-6 text-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? 'Processing...' : 'Generate Base Article'}
              {!isGenerating && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AIProcessingLoader 
        isProcessing={isGenerating} 
        steps={PROCESS_STEPS} 
        currentStepIndex={currentStepIndex} 
      />

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Your AI Content</h3>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No content generated yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}/basearticle`}>
                <Card className="overflow-hidden border-border transition-all hover:border-foreground/50 hover:shadow-lg shadow-md cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
                      <span className="font-bold text-muted-foreground mr-2">Topic:</span> 
                      {article.originalTopic}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
