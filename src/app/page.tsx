'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TweetPlanner } from '@/components/TweetPlanner';
import { ArticleGenerator } from '@/components/ArticleGenerator';
import { MessageCircle, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground py-12 px-6 overflow-x-hidden">
      <main className="max-w-5xl mx-auto">
        <Tabs defaultValue="tweets" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="tweets">Tweets</TabsTrigger>
              <TabsTrigger value="articles">Articles</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tweets" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <TweetPlanner />
          </TabsContent>

          <TabsContent value="articles" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <ArticleGenerator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
