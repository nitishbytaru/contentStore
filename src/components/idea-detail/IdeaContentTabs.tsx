'use client';

import { useEffect, useRef } from 'react';
import { Tv, FileText, BookOpen, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Idea } from '@/types';
import { ArticlePromptButton } from '@/components/idea-detail/ArticlePromptButton';
import { ResearchChat } from '@/components/idea-detail/ResearchChat';
import { cn } from 'cn';

interface ContentTabOption {
  value: 'baseArticle' | 'mediumArticle' | 'youtubeScript';
  label: string;
  icon: any;
  placeholder: string;
}

interface IdeaContentTabsProps {
  idea: Idea;
  activeContentTab: string;
  contentTabs: ContentTabOption[];
  onTabChange: (tab: string) => void;
  onTextChange: (field: keyof Idea, value: string) => void;
  onCopyContent: (text: string) => void;
  onOpenPrompter: () => void;
  onResearchClearing?: (clearing: boolean) => void;
  onApplyingPrompt?: (applying: boolean) => void;
  locked?: boolean;
}

export function IdeaContentTabs({
  idea,
  activeContentTab,
  contentTabs,
  onTabChange,
  onTextChange,
  onCopyContent,
  onOpenPrompter,
  onResearchClearing,
  onApplyingPrompt,
  locked = false,
}: IdeaContentTabsProps) {
  // Ref to auto-expand video script textarea so it is not scrollable and shows all text at a stretch
  const videoScriptRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (activeContentTab === 'youtubeScript' && videoScriptRef.current) {
      const el = videoScriptRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 360)}px`;
    }
  }, [activeContentTab, idea.youtubeScript]);

  return (
    <div className="w-full min-w-0">
      <Card className="w-full min-w-0 overflow-hidden shadow-xs border-border/70">
        <CardContent className="p-3.5 sm:p-6 w-full min-w-0 overflow-hidden">
          <Tabs value={activeContentTab} onValueChange={(val) => val && onTabChange(val)} className="w-full min-w-0">
            {/* Dynamic Navigation Tabs */}
            <TabsList
              className={cn(
                'grid w-full rounded-xl p-1 bg-muted/60 mb-4 border border-border/50 h-auto min-w-0 gap-1',
                contentTabs.length === 1
                  ? 'grid-cols-1 max-w-xs'
                  : contentTabs.length === 2
                  ? 'grid-cols-2 max-w-md'
                  : 'grid-cols-3'
              )}
            >
              {contentTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeContentTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={locked}
                    className={cn(
                      'text-xs sm:text-sm py-2 px-2 text-center truncate min-w-0 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      isActive
                        ? 'bg-background text-foreground shadow-sm font-semibold border border-border/70'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Dynamic Content Views */}
            {contentTabs.map((tab) => {
              const isVideoScript = tab.value === 'youtubeScript';
              const contentText = (idea[tab.value as keyof Idea] as string) || '';
              const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
              const readingTimeMins = Math.max(1, Math.round(wordCount / 130));

              return (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="focus-visible:outline-none focus-visible:ring-0 mt-0 w-full min-w-0"
                >
                  {/* Section Toolbar / Info Bar */}
                  {tab.value !== 'baseArticle' && <div className="flex items-center justify-between gap-2 mb-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {isVideoScript ? (
                        <span className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 shrink-0">
                          <Tv className="w-3.5 h-3.5" />
                          Video Script
                        </span>
                      ) : tab.value === 'mediumArticle' ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                          Article Draft
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0">
                          <BookOpen className="w-3.5 h-3.5" />
                          Research Notes
                        </span>
                      )}

                      {wordCount > 0 && (
                        <span className="text-[11px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full font-mono shrink-0">
                          {wordCount} words {isVideoScript ? `• ~${readingTimeMins}m read` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {isVideoScript && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={onOpenPrompter}
                          className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-border/70 hover:bg-muted cursor-pointer"
                          title="Open full-screen prompter for recording from a distance"
                        >
                          <Tv className="w-3.5 h-3.5 text-rose-500" />
                          Prompter
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7.5 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted cursor-pointer"
                        onClick={() => onCopyContent(contentText)}
                        title="Copy content"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline text-xs">Copy</span>
                      </Button>
                    </div>
                  </div>}


                  <div className="relative group w-full min-w-0">
                    {tab.value === 'baseArticle' ? (
                      <ResearchChat
                        ideaId={idea.ideaId}
                        title={idea.idea}
                        onArticleGenerated={(article) => {
                          onTextChange('mediumArticle', article);
                          onTabChange('mediumArticle');
                        }}
                        onClearingChange={onResearchClearing}
                      />
                    ) : isVideoScript ? (
                      <Textarea
                        ref={videoScriptRef}
                        placeholder={tab.placeholder}
                        value={contentText}
                        onChange={(e) => {
                          onTextChange('youtubeScript', e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.max(e.target.scrollHeight, 360)}px`;
                        }}
                        className="min-h-[360px] h-auto overflow-hidden [field-sizing:content] resize-none w-full max-w-full text-sm p-3.5 sm:p-5 leading-relaxed break-words"
                      />
                    ) : (
                      <>
                        <Textarea
                          placeholder={tab.placeholder}
                          value={contentText}
                          disabled={locked}
                          onChange={(e) => onTextChange(tab.value as keyof Idea, e.target.value)}
                          className="h-[440px] sm:h-[520px] md:h-[580px] max-h-[72vh] w-full max-w-full resize-none sm:resize-y text-sm p-3.5 sm:p-5 leading-relaxed break-words overflow-x-hidden overflow-y-auto overscroll-contain"
                        />
                        {contentText.trim() && (
                          <ArticlePromptButton
                            ideaId={idea.ideaId}
                            article={contentText}
                            onArticle={(article) => onTextChange('mediumArticle', article)}
                            onApplyingChange={onApplyingPrompt}
                          />
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
