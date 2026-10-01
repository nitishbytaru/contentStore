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
          <div className="flex justify-center mb-12">
            <TabsList className="grid grid-cols-2 w-full max-w-md p-1 h-auto rounded-full bg-muted/50 border border-border">
              <TabsTrigger value="tweets" className="rounded-full py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Tweet Planner
              </TabsTrigger>
              <TabsTrigger value="articles" className="rounded-full py-3 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-fuchsia-500 data-[state=active]:shadow-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Articles
              </TabsTrigger>
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
