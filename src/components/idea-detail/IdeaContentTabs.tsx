'use client';

import { useEffect, useRef } from 'react';
import { 
  Tv, FileText, Video, BookOpen, Film, Scissors, Upload, Copy, Edit3 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Idea } from '@/types';
import { ResearchChat } from '@/components/idea-detail/ResearchChat';
import { formatDateTimeDisplay, toDateTimeLocalValue } from '@/utils/dateTime';
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
  onOpenVideoModal: () => void;
  onToggleDraftedArticle: () => void;
  onTogglePublishArticle: () => void;
  onQuickToggleShooting: () => void;
  onQuickToggleEditing: () => void;
  onQuickToggleUploaded: () => void;
  onEditDateKey: (key: keyof Idea, currentVal: string) => void;
}

export function IdeaContentTabs({
  idea,
  activeContentTab,
  contentTabs,
  onTabChange,
  onTextChange,
  onCopyContent,
  onOpenPrompter,
  onOpenVideoModal,
  onToggleDraftedArticle,
  onTogglePublishArticle,
  onQuickToggleShooting,
  onQuickToggleEditing,
  onQuickToggleUploaded,
  onEditDateKey,
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
                      {/* Video Stage Prompt button */}
                      {isVideoScript && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={onOpenVideoModal}
                          className="h-7.5 px-3 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          title="Update Shooting, Editing, and Uploaded stages"
                        >
                          <Film className="h-3.5 w-3.5" />
                          Update Video Stages
                        </Button>
                      )}

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

                  {/* Article Stage Progression Banner */}
                  {tab.value === 'mediumArticle' && (
                    <div className="mb-3 p-2.5 sm:p-3 rounded-xl border border-border/75 bg-muted/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Article Stages:
                        </span>

                        {/* Stage 1: Drafted */}
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors',
                            idea.articleDraftedDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'bg-card border-border/70 text-muted-foreground'
                          )}
                        >
                          <button
                            type="button"
                            onClick={onToggleDraftedArticle}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                          >
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                idea.articleDraftedDone ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                              )}
                            />
                            <span>{idea.articleDraftedDone ? '1. Drafted ✓' : '1. Mark as Drafted'}</span>
                          </button>
                          {idea.articleDraftedDone && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                              <span className="opacity-80">
                                {formatDateTimeDisplay(idea.articleDraftedAt) || 'Recorded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onEditDateKey('articleDraftedAt', toDateTimeLocalValue(idea.articleDraftedAt))
                                }
                                className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                title="Edit date & time"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Stage 2: Published */}
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors',
                            idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'bg-card border-border/70 text-muted-foreground'
                          )}
                        >
                          <button
                            type="button"
                            onClick={onTogglePublishArticle}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                          >
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack
                                  ? 'bg-emerald-500'
                                  : 'bg-muted-foreground/40'
                              )}
                            />
                            <span>
                              {idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack
                                ? '2. Published ✓'
                                : '2. Mark as Published'}
                            </span>
                          </button>
                          {(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack) && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                              <span className="opacity-80">
                                {formatDateTimeDisplay(idea.articlePublishedAt) || 'Recorded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onEditDateKey('articlePublishedAt', toDateTimeLocalValue(idea.articlePublishedAt))
                                }
                                className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                title="Edit date & time"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Stage Progression Banner */}
                  {isVideoScript && (
                    <div className="mb-3 p-2.5 sm:p-3 rounded-xl border border-border/75 bg-muted/25 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Video Stages:
                        </span>

                        {/* Stage 1: Shooting */}
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors',
                            idea.videoShootingDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'bg-card border-border/70 text-muted-foreground'
                          )}
                        >
                          <button
                            type="button"
                            onClick={onQuickToggleShooting}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                          >
                            <Film className="w-3 h-3 opacity-70" />
                            <span>{idea.videoShootingDone ? '1. Shooting ✓' : '1. Shooting Pending'}</span>
                          </button>
                          {idea.videoShootingDone && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                              <span className="opacity-80">
                                {formatDateTimeDisplay(idea.videoShootingAt) || 'Recorded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onEditDateKey('videoShootingAt', toDateTimeLocalValue(idea.videoShootingAt))
                                }
                                className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                title="Edit date & time"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Stage 2: Editing */}
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors',
                            idea.videoEditingDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'bg-card border-border/70 text-muted-foreground'
                          )}
                        >
                          <button
                            type="button"
                            onClick={onQuickToggleEditing}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                          >
                            <Scissors className="w-3 h-3 opacity-70" />
                            <span>{idea.videoEditingDone ? '2. Editing ✓' : '2. Editing Pending'}</span>
                          </button>
                          {idea.videoEditingDone && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                              <span className="opacity-80">
                                {formatDateTimeDisplay(idea.videoEditingAt) || 'Recorded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onEditDateKey('videoEditingAt', toDateTimeLocalValue(idea.videoEditingAt))
                                }
                                className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                title="Edit date & time"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Stage 3: Uploaded */}
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors',
                            idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
                              : 'bg-card border-border/70 text-muted-foreground'
                          )}
                        >
                          <button
                            type="button"
                            onClick={onQuickToggleUploaded}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                          >
                            <Upload className="w-3 h-3 opacity-70" />
                            <span>
                              {idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram
                                ? '3. Uploaded ✓'
                                : '3. Upload Pending'}
                            </span>
                          </button>
                          {(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram) && (
                            <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                              <span className="opacity-80">
                                {formatDateTimeDisplay(idea.videoUploadedAt) || 'Recorded'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onEditDateKey('videoUploadedAt', toDateTimeLocalValue(idea.videoUploadedAt))
                                }
                                className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                title="Edit date & time"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onOpenVideoModal}
                        className="h-7 text-xs font-semibold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 p-1.5 shrink-0 cursor-pointer"
                        title="Open full stages dialog"
                      >
                        <Film className="w-3.5 h-3.5" />
                        Update Stages &amp; Timestamps
                      </Button>
                    </div>
                  )}

                  <div className="relative group w-full min-w-0">
                    {tab.value === 'baseArticle' ? (
                      <ResearchChat
                        ideaId={idea.ideaId}
                        title={idea.idea}
                        onArticleGenerated={(article) => {
                          onTextChange('mediumArticle', article);
                          onTabChange('mediumArticle');
                        }}
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
                      <Textarea
                        placeholder={tab.placeholder}
                        value={contentText}
                        onChange={(e) => onTextChange(tab.value as keyof Idea, e.target.value)}
                        className="h-[440px] sm:h-[520px] md:h-[580px] max-h-[72vh] w-full max-w-full resize-none sm:resize-y text-sm p-3.5 sm:p-5 leading-relaxed break-words overflow-x-hidden overflow-y-auto overscroll-contain"
                      />
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
