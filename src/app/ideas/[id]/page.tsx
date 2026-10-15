'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Copy, Loader2, Sparkles, Tv } from 'lucide-react';
import { toast } from 'sonner';
import ScriptPrompter from '@/components/ScriptPrompter';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas, updateIdea } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';
import { cn } from 'cn';
import { getIdeaPublishStatus } from '@/lib/ideaStatus';

interface IdeaDetails {
  id: string;
  idea: string;
  baseArticle: string;
  mediumArticle: string;
  youtubeScript: string;
  eligibleMedium: boolean;
  eligibleSubstack: boolean;
  eligibleX: boolean;
  eligibleYoutube: boolean;
  eligibleInstagram: boolean;
  ineligibleMedium: boolean;
  ineligibleSubstack: boolean;
  ineligibleX: boolean;
  ineligibleYoutube: boolean;
  ineligibleInstagram: boolean;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedX: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
}

export default function IdeaEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useDispatch<AppDispatch>();
  const { items: ideas, loading: storeLoading, hasFetched } = useSelector((state: RootState) => state.ideas);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<IdeaDetails | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<string>('baseArticle');
  const [isPrompterOpen, setIsPrompterOpen] = useState(false);

  // Initialize and fetch from store if needed
  useEffect(() => {
    const existingIdea = ideas.find(i => i.id === id);
    if (existingIdea) {
      setIdea(existingIdea as IdeaDetails);
      setLoading(false);
    } else if (!hasFetched && !storeLoading) {
      const loadData = async () => {
        setLoading(true);
        const result = await dispatch(fetchIdeas());
        if (fetchIdeas.fulfilled.match(result)) {
          const found = result.payload.find((i: { id: string }) => i.id === id);
          if (found) {
            setIdea(found as IdeaDetails);
          }
        }
        setLoading(false);
      };
      loadData();
    } else if (hasFetched && !existingIdea) {
      setLoading(false);
    }
  }, [id, dispatch, ideas, storeLoading, hasFetched]);

  const handleSave = async () => {
    if (!idea) return;

    const isXSelected = idea.eligibleX || idea.ineligibleX;
    const isArticlesSelected = idea.eligibleMedium || idea.ineligibleMedium;
    const isVideosSelected = idea.eligibleYoutube || idea.ineligibleYoutube;

    if (!isXSelected || !isArticlesSelected || !isVideosSelected) {
      toast.error('Please select Eligible or Ineligible for all sections in the Publishing Checklist.');
      return;
    }

    try {
      setSaving(true);
      const result = await dispatch(updateIdea(idea));
      if (updateIdea.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      toast.success('Changes saved successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to save: ' + message);
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (field: keyof IdeaDetails, value: string) => {
    setIdea(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleCopyContent = (text: string) => {
    if (!text) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleCheckboxChange = (fields: (keyof IdeaDetails)[], checked: boolean) => {
    setIdea(prev => {
      if (!prev) return prev;
      const updates: Partial<IdeaDetails> = {};
      fields.forEach(f => {
        (updates[f] as boolean) = checked;
      });
      return { ...prev, ...updates };
    });
  };

  if (loading || storeLoading) {
    return (
      <div className="space-y-6 pt-2 w-full max-w-full min-w-0">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          <div className="lg:col-span-2 space-y-4 w-full min-w-0">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div className="space-y-4 w-full min-w-0">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="py-12 text-center text-muted-foreground w-full">
        Idea not found. <Link href="/ideas" className="text-primary hover:underline">Go back</Link>
      </div>
    );
  }

  const contentTabs = [
    { value: 'baseArticle', label: 'Research', placeholder: 'Draft your research notes here...' },
    { value: 'mediumArticle', label: 'Article', placeholder: 'Draft your article here...' },
    { value: 'youtubeScript', label: 'Video Script', placeholder: 'Long-form video script...' },
  ] as const;

  const platforms = [
    { eligibleIds: ['eligibleX'], publishedIds: ['publishedX'], ineligibleIds: ['ineligibleX'], label: 'X (Twitter)' },
    { eligibleIds: ['eligibleMedium', 'eligibleSubstack'], publishedIds: ['publishedMedium', 'publishedSubstack'], ineligibleIds: ['ineligibleMedium', 'ineligibleSubstack'], label: 'Articles (Medium & Substack)' },
    { eligibleIds: ['eligibleYoutube', 'eligibleInstagram'], publishedIds: ['publishedYoutube', 'publishedInstagram'], ineligibleIds: ['ineligibleYoutube', 'ineligibleInstagram'], label: 'Videos (YouTube & Instagram)' },
  ];

  const publishStatus = idea ? getIdeaPublishStatus(idea) : null;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Bar Navigation & Save Button */}
      <div className="flex items-center justify-between gap-4 w-full min-w-0">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Ideas
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-auto shrink-0 shadow-sm font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* "Working on" Responsive Box/Card Container */}
      <div className="relative overflow-hidden w-full min-w-0 rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-all">
        {/* Subtle accent border line */}
        {publishStatus && (
          <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", publishStatus.accentGradient)} />
        )}
        
        {/* Top Meta Bar: Status badge on left, Copy Idea button on right */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {publishStatus && (
            <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider", publishStatus.badgeClass)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", publishStatus.dotClass, publishStatus.status === 'untouched' ? 'animate-pulse' : '')} />
              <span>{publishStatus.label}</span>
            </div>
          )}

          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70 hover:border-border hover:bg-muted/60 transition-colors shrink-0" 
            onClick={() => handleCopyContent(idea.idea)}
            title="Copy idea text"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="text-xs">Copy Idea</span>
          </Button>
        </div>

        {/* Idea Title */}
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground break-words [overflow-wrap:anywhere] leading-snug sm:leading-relaxed">
          {idea.idea}
        </h1>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Main Content Area */}
        <div className="lg:col-span-2 w-full min-w-0">
          <Card className="w-full min-w-0 overflow-hidden shadow-xs border-border/70">
            <CardContent className="p-3.5 sm:p-6 w-full min-w-0 overflow-hidden">
              <Tabs value={activeContentTab} onValueChange={(val) => val && setActiveContentTab(val)} className="w-full min-w-0">
                <TabsList className="grid grid-cols-3 w-full rounded-xl p-1 bg-muted/60 mb-4 border border-border/50 h-auto min-w-0 gap-1">
                  {contentTabs.map(tab => {
                    const isActive = activeContentTab === tab.value;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                          "text-xs sm:text-sm py-2 px-1 sm:px-3 text-center truncate min-w-0 font-medium rounded-lg transition-all",
                          isActive
                            ? "bg-background text-foreground shadow-sm font-semibold border border-border/70"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {contentTabs.map(tab => {
                  const isVideoScript = tab.value === 'youtubeScript';
                  const contentText = (idea[tab.value as keyof IdeaDetails] as string) || '';
                  const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
                  const readingTimeMins = Math.max(1, Math.round(wordCount / 130));

                  return (
                    <TabsContent
                      key={tab.value}
                      value={tab.value}
                      className="focus-visible:outline-none focus-visible:ring-0 mt-0 w-full min-w-0"
                    >
                      {/* Section Toolbar / Info Bar */}
                      <div className="flex items-center justify-between gap-2 mb-2 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {isVideoScript ? (
                            <span className="text-xs font-semibold text-primary flex items-center gap-1.5 shrink-0">
                              <Tv className="w-3.5 h-3.5" />
                              Video Script
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground truncate">
                              {tab.label}
                            </span>
                          )}
                          {wordCount > 0 && (
                            <span className="text-[11px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full font-mono shrink-0">
                              {wordCount} words {isVideoScript ? `• ~${readingTimeMins}m read` : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isVideoScript && (
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={() => setIsPrompterOpen(true)}
                              className="h-7.5 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                              title="Open full-screen prompter for recording from a distance"
                            >
                              <Tv className="h-3.5 w-3.5" />
                              Prompter
                            </Button>
                          )}
                          <Button 
                            type="button"
                            size="sm" 
                            variant="outline" 
                            className="h-7.5 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted"
                            onClick={() => handleCopyContent(contentText)}
                            title="Copy content"
                          >
                            <Copy className="h-3 w-3" />
                            <span className="hidden sm:inline text-xs">Copy</span>
                          </Button>
                        </div>
                      </div>

                      <div className="relative group w-full min-w-0">
                        <Textarea 
                          placeholder={tab.placeholder}
                          value={contentText}
                          onChange={(e) => handleTextChange(tab.value as keyof IdeaDetails, e.target.value)}
                          className="h-[380px] sm:h-[480px] md:h-[520px] max-h-[65vh] w-full max-w-full resize-none sm:resize-y text-sm p-3.5 sm:p-4 leading-relaxed break-words overflow-x-hidden overflow-y-auto overscroll-contain"
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Publishing Checklist */}
        <div className="w-full min-w-0">
          <Card className="w-full min-w-0 overflow-hidden lg:sticky lg:top-20 shadow-xs border-border/70">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Publishing Checklist</span>
              </CardTitle>
              <CardDescription className="text-xs">Track where this content is live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              {platforms.map((platform, idx) => {
                const isEligible = idea[platform.eligibleIds[0] as keyof IdeaDetails] as boolean;
                const isPublished = idea[platform.publishedIds[0] as keyof IdeaDetails] as boolean;
                const isIneligible = idea[platform.ineligibleIds[0] as keyof IdeaDetails] as boolean;
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 space-y-2.5 transition-colors w-full min-w-0 ${
                      isIneligible ? 'bg-muted/30 border-muted' : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium break-words ${
                        isIneligible ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {platform.label}
                    </p>
                    
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Checkbox
                        id={`ineligible-${idx}`}
                        checked={isIneligible}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(platform.ineligibleIds as (keyof IdeaDetails)[], checked as boolean);
                          if (checked) {
                            handleCheckboxChange(platform.eligibleIds as (keyof IdeaDetails)[], false);
                            handleCheckboxChange(platform.publishedIds as (keyof IdeaDetails)[], false);
                          }
                        }}
                        className="h-4 w-4 shrink-0 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                      />
                      <label
                        htmlFor={`ineligible-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-destructive transition-colors truncate"
                      >
                        Ineligible (Skip)
                      </label>
                    </div>

                    <div className={`flex items-center gap-2.5 min-w-0 ${isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
                      <Checkbox
                        id={`eligible-${idx}`}
                        checked={isEligible}
                        disabled={isIneligible}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(platform.eligibleIds as (keyof IdeaDetails)[], checked as boolean);
                          if (checked) {
                            handleCheckboxChange(platform.ineligibleIds as (keyof IdeaDetails)[], false);
                          } else {
                            handleCheckboxChange(platform.publishedIds as (keyof IdeaDetails)[], false);
                          }
                        }}
                        className="h-4 w-4 shrink-0 data-[state=checked]:bg-primary"
                      />
                      <label
                        htmlFor={`eligible-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-primary transition-colors truncate"
                      >
                        Eligible
                      </label>
                    </div>

                    <div className={`flex items-center gap-2.5 min-w-0 ${!isEligible || isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
                      <Checkbox
                        id={`published-${idx}`}
                        checked={isPublished}
                        disabled={!isEligible || isIneligible}
                        onCheckedChange={(checked) => handleCheckboxChange(platform.publishedIds as (keyof IdeaDetails)[], checked as boolean)}
                        className="h-4 w-4 shrink-0 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor={`published-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-green-500 transition-colors truncate"
                      >
                        Published
                      </label>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Video Script Prompter */}
      {idea && (
        <ScriptPrompter
          isOpen={isPrompterOpen}
          onClose={() => setIsPrompterOpen(false)}
          title={idea.idea}
          script={idea.youtubeScript || ''}
        />
      )}
    </div>
  );
}
