'use client';

import { useEffect, useState, useMemo, useRef, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Save, Copy, Loader2, Tv, FileText, Video, 
  BookOpen, Sparkles, Settings2, Check, X 
} from 'lucide-react';
import { toast } from 'sonner';
import ScriptPrompter from '@/components/ScriptPrompter';

import { Button } from '@/components/ui/button';
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
  description?: string;
  baseArticle: string;
  mediumArticle: string;
  youtubeScript: string;
  eligibleMedium: boolean;
  eligibleSubstack: boolean;
  eligibleYoutube: boolean;
  eligibleInstagram: boolean;
  ineligibleMedium: boolean;
  ineligibleSubstack: boolean;
  ineligibleYoutube: boolean;
  ineligibleInstagram: boolean;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
}

type OnboardingStep = 'RESEARCH' | 'QUESTION_ARTICLE' | 'QUESTION_VIDEO' | 'WORKSPACE';

export default function IdeaEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useDispatch<AppDispatch>();
  const { items: ideas, loading: storeLoading, hasFetched } = useSelector((state: RootState) => state.ideas);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<IdeaDetails | null>(null);
  const [step, setStep] = useState<OnboardingStep>('WORKSPACE');
  const [initialResearchText, setInitialResearchText] = useState('');
  const [pendingArticleAnswer, setPendingArticleAnswer] = useState<boolean | null>(null);
  
  const [activeContentTab, setActiveContentTab] = useState<string>('baseArticle');
  const [isPrompterOpen, setIsPrompterOpen] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  // Ref to auto-expand video script textarea so it is not scrollable and shows all text at a stretch
  const videoScriptRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (activeContentTab === 'youtubeScript' && videoScriptRef.current) {
      const el = videoScriptRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 360)}px`;
    }
  }, [activeContentTab, idea?.youtubeScript]);

  // Initialize and load idea
  useEffect(() => {
    const existingIdea = ideas.find(i => i.id === id);
    if (existingIdea) {
      const details = existingIdea as IdeaDetails;
      setIdea(details);
      
      const hasResearch = Boolean(details.baseArticle && details.baseArticle.trim().length > 0);
      const hasAnsweredFormats = Boolean(
        details.eligibleMedium || details.ineligibleMedium ||
        details.eligibleYoutube || details.ineligibleYoutube ||
        (details.mediumArticle && details.mediumArticle.trim()) ||
        (details.youtubeScript && details.youtubeScript.trim())
      );

      if (!hasResearch) {
        setStep('RESEARCH');
        setInitialResearchText(details.description || '');
      } else if (!hasAnsweredFormats) {
        setStep('QUESTION_ARTICLE');
      } else {
        setStep('WORKSPACE');
      }
      setLoading(false);
    } else if (!hasFetched && !storeLoading) {
      const loadData = async () => {
        setLoading(true);
        const result = await dispatch(fetchIdeas());
        if (fetchIdeas.fulfilled.match(result)) {
          const found = result.payload.find((i: { id: string }) => i.id === id);
          if (found) {
            const details = found as IdeaDetails;
            setIdea(details);
            const hasResearch = Boolean(details.baseArticle && details.baseArticle.trim().length > 0);
            const hasAnsweredFormats = Boolean(
              details.eligibleMedium || details.ineligibleMedium ||
              details.eligibleYoutube || details.ineligibleYoutube ||
              (details.mediumArticle && details.mediumArticle.trim()) ||
              (details.youtubeScript && details.youtubeScript.trim())
            );

            if (!hasResearch) {
              setStep('RESEARCH');
              setInitialResearchText(details.description || '');
            } else if (!hasAnsweredFormats) {
              setStep('QUESTION_ARTICLE');
            } else {
              setStep('WORKSPACE');
            }
          }
        }
        setLoading(false);
      };
      loadData();
    } else if (hasFetched && !existingIdea) {
      setLoading(false);
    }
  }, [id, dispatch, ideas, storeLoading, hasFetched]);

  // Determine enabled formats
  const isArticleSelected = Boolean(
    idea && (idea.eligibleMedium || idea.eligibleSubstack || (idea.mediumArticle && idea.mediumArticle.trim().length > 0))
  );

  const isVideoSelected = Boolean(
    idea && (idea.eligibleYoutube || idea.eligibleInstagram || (idea.youtubeScript && idea.youtubeScript.trim().length > 0))
  );

  // Dynamic content tabs based on questions answered
  const contentTabs = useMemo(() => {
    const tabs: Array<{ value: 'baseArticle' | 'mediumArticle' | 'youtubeScript'; label: string; icon: any; placeholder: string }> = [
      { 
        value: 'baseArticle', 
        label: 'Research', 
        icon: BookOpen, 
        placeholder: 'Draft your research notes, outlines, and key insights here...' 
      }
    ];

    if (isArticleSelected) {
      tabs.push({ 
        value: 'mediumArticle', 
        label: 'Article', 
        icon: FileText, 
        placeholder: 'Draft your Medium/Substack article here...' 
      });
    }

    if (isVideoSelected) {
      tabs.push({ 
        value: 'youtubeScript', 
        label: 'Video Script', 
        icon: Video, 
        placeholder: 'Write your video script here... (use prompter to record)' 
      });
    }

    return tabs;
  }, [isArticleSelected, isVideoSelected]);

  // Ensure active tab is always valid
  useEffect(() => {
    if (contentTabs.length > 0 && !contentTabs.some(t => t.value === activeContentTab)) {
      setActiveContentTab(contentTabs[0].value);
    }
  }, [contentTabs, activeContentTab]);

  const handleSave = async () => {
    if (!idea) return;

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

  // Submit Initial Research
  const handleSubmitResearch = async () => {
    if (!idea || !initialResearchText.trim()) return;

    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        baseArticle: initialResearchText.trim(),
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success('Initial research saved!');
      // Proceed to Question 1
      setStep('QUESTION_ARTICLE');
    } catch (err: any) {
      toast.error('Failed to save research: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Answer Question 1: Article?
  const handleAnswerArticle = (answer: boolean) => {
    setPendingArticleAnswer(answer);
    // Proceed to Question 2
    setStep('QUESTION_VIDEO');
  };

  // Answer Question 2: Video?
  const handleAnswerVideo = async (videoAnswer: boolean) => {
    if (!idea) return;
    const articleAnswer = pendingArticleAnswer ?? false;

    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        eligibleMedium: articleAnswer,
        eligibleSubstack: articleAnswer,
        ineligibleMedium: !articleAnswer,
        ineligibleSubstack: !articleAnswer,
        eligibleYoutube: videoAnswer,
        eligibleInstagram: videoAnswer,
        ineligibleYoutube: !videoAnswer,
        ineligibleInstagram: !videoAnswer,
      };

      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));

      const enabledList: string[] = ['Research'];
      if (articleAnswer) enabledList.push('Article');
      if (videoAnswer) enabledList.push('Video Script');

      toast.success(`Workspace activated with: ${enabledList.join(', ')}`);

      if (articleAnswer) {
        setActiveContentTab('mediumArticle');
      } else if (videoAnswer) {
        setActiveContentTab('youtubeScript');
      } else {
        setActiveContentTab('baseArticle');
      }

      setStep('WORKSPACE');
    } catch (err: any) {
      toast.error('Failed to save formats: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reconfigure formats from workspace
  const handleToggleFormat = async (format: 'article' | 'video', enable: boolean) => {
    if (!idea) return;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        ...(format === 'article' ? {
          eligibleMedium: enable,
          eligibleSubstack: enable,
          ineligibleMedium: !enable,
          ineligibleSubstack: !enable,
        } : {
          eligibleYoutube: enable,
          eligibleInstagram: enable,
          ineligibleYoutube: !enable,
          ineligibleInstagram: !enable,
        })
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(`${format === 'article' ? 'Article' : 'Video'} tab ${enable ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error('Failed to update formats: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || storeLoading) {
    return (
      <div className="space-y-6 pt-2 w-full max-w-full min-w-0">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-4 w-full min-w-0">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[480px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="py-12 text-center text-muted-foreground w-full">
        Idea not found. <Link href="/ideas" className="text-primary hover:underline">Go back to Ideas</Link>
      </div>
    );
  }

  const publishStatus = idea ? getIdeaPublishStatus(idea) : null;

  // STEP 1: INITIAL RESEARCH PROMPT
  if (step === 'RESEARCH') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-2">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Ideas
        </Link>

        {/* Idea Banner */}
        <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">New Content Idea</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
            {idea.idea}
          </h1>
        </div>

        {/* Paste Initial Research Card */}
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="p-5 sm:p-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Paste Initial Research</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Paste your raw research, key takeaways, links, or bullet points to get started.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Research Content</span>
                {initialResearchText.trim().length > 0 && (
                  <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded-full">
                    {initialResearchText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Paste your initial research notes, outline, source links, or raw brainstorm here..."
                value={initialResearchText}
                onChange={(e) => setInitialResearchText(e.target.value)}
                className="min-h-[260px] sm:min-h-[320px] max-h-[60vh] text-sm leading-relaxed p-4"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Allow proceeding directly to workspace if they prefer
                  setStep('QUESTION_ARTICLE');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip research for now
              </Button>
              <Button
                type="button"
                onClick={handleSubmitResearch}
                disabled={!initialResearchText.trim() || saving}
                className="font-medium gap-2 shadow-sm px-5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Submit Initial Research</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 2: SEQUENTIAL QUESTIONS (ARTICLE & VIDEO)
  if (step === 'QUESTION_ARTICLE' || step === 'QUESTION_VIDEO') {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Content Setup</span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-md mx-auto">
            {idea.idea}
          </h2>
        </div>

        {/* Question 1: Article */}
        {step === 'QUESTION_ARTICLE' && (
          <Card className="border-border/80 shadow-md animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-6 sm:p-8 text-center space-y-5">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Question 1 of 2</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Are you writing an article for this?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  Enables an Article drafting workspace for Medium, Substack, and long-form blog posts.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => handleAnswerArticle(false)}
                  className="w-full text-sm font-medium border-border/80 hover:bg-muted cursor-pointer"
                >
                  No
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleAnswerArticle(true)}
                  className="w-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                >
                  Yes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question 2: Video */}
        {step === 'QUESTION_VIDEO' && (
          <Card className="border-border/80 shadow-md animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-6 sm:p-8 text-center space-y-5">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xs">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Question 2 of 2</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Are you creating a video for this?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  Enables a Video Script workspace complete with our full-screen teleprompter.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-xs mx-auto">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => handleAnswerVideo(false)}
                  disabled={saving}
                  className="w-full text-sm font-medium border-border/80 hover:bg-muted cursor-pointer"
                >
                  No
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleAnswerVideo(true)}
                  disabled={saving}
                  className="w-full text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Yes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // STEP 3: WORKSPACE WITH DYNAMIC TABS (NO PUBLISHING CHECKLIST)
  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <Link
          href="/ideas"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Ideas
        </Link>

        <div className="flex items-center gap-2">
          {/* Formats settings button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFormatModalOpen(true)}
            className="h-9 px-2.5 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground border-border/80"
            title="Configure Article and Video tabs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configure Formats</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 shadow-sm font-medium gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Idea Title Banner */}
      <div className="relative overflow-hidden w-full min-w-0 rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 via-card/85 to-card/70 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-all">
        {publishStatus && (
          <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", publishStatus.accentGradient)} />
        )}
        
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {publishStatus && (
              <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider", publishStatus.badgeClass)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", publishStatus.dotClass)} />
                <span>{publishStatus.label}</span>
              </div>
            )}
            
            {/* Active format badges */}
            {isArticleSelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <FileText className="w-3 h-3" /> Article
              </span>
            )}
            {isVideoSelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/25">
                <Video className="w-3 h-3" /> Video
              </span>
            )}
          </div>

          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/70 hover:border-border hover:bg-muted/60 transition-colors shrink-0" 
            onClick={() => handleCopyContent(idea.idea)}
            title="Copy idea title"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Copy Title</span>
          </Button>
        </div>

        {/* Idea Title */}
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground break-words [overflow-wrap:anywhere] leading-snug sm:leading-relaxed">
          {idea.idea}
        </h1>
      </div>

      {/* Main Content Area - Full width with dynamic navigation tabs */}
      <div className="w-full min-w-0">
        <Card className="w-full min-w-0 overflow-hidden shadow-xs border-border/70">
          <CardContent className="p-3.5 sm:p-6 w-full min-w-0 overflow-hidden">
            <Tabs value={activeContentTab} onValueChange={(val) => val && setActiveContentTab(val)} className="w-full min-w-0">
              {/* Dynamic Navigation Tabs */}
              <TabsList className={cn(
                "grid w-full rounded-xl p-1 bg-muted/60 mb-4 border border-border/50 h-auto min-w-0 gap-1",
                contentTabs.length === 1 ? "grid-cols-1 max-w-xs" :
                contentTabs.length === 2 ? "grid-cols-2 max-w-md" : "grid-cols-3"
              )}>
                {contentTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeContentTab === tab.value;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "text-xs sm:text-sm py-2 px-2 text-center truncate min-w-0 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
                        isActive
                          ? "bg-background text-foreground shadow-sm font-semibold border border-border/70"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Dynamic Content Views */}
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isVideoScript && (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => setIsPrompterOpen(true)}
                            className="h-7.5 px-3 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
                      {isVideoScript ? (
                        <Textarea 
                          ref={videoScriptRef}
                          placeholder={tab.placeholder}
                          value={contentText}
                          onChange={(e) => {
                            handleTextChange('youtubeScript', e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.max(e.target.scrollHeight, 360)}px`;
                          }}
                          className="min-h-[360px] h-auto overflow-hidden [field-sizing:content] resize-none w-full max-w-full text-sm p-3.5 sm:p-5 leading-relaxed break-words"
                        />
                      ) : (
                        <Textarea 
                          placeholder={tab.placeholder}
                          value={contentText}
                          onChange={(e) => handleTextChange(tab.value as keyof IdeaDetails, e.target.value)}
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

      {/* Format Configuration Dialog */}
      {isFormatModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
          onClick={() => setIsFormatModalOpen(false)}
        >
          <div 
            className="bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-foreground">Content Formats</h3>
                <p className="text-xs text-muted-foreground">Select the navigation workspaces for this idea.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormatModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Article format toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">Article Draft</h4>
                    <p className="text-[11px] text-muted-foreground">Medium, Substack, blog post</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isArticleSelected ? "default" : "outline"}
                  onClick={() => handleToggleFormat('article', !isArticleSelected)}
                  disabled={saving}
                  className={cn("h-8 text-xs font-medium", isArticleSelected && "bg-emerald-600 hover:bg-emerald-700")}
                >
                  {isArticleSelected ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                  {isArticleSelected ? 'Enabled' : 'Enable'}
                </Button>
              </div>

              {/* Video format toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold">Video Script</h4>
                    <p className="text-[11px] text-muted-foreground">YouTube script &amp; prompter</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isVideoSelected ? "default" : "outline"}
                  onClick={() => handleToggleFormat('video', !isVideoSelected)}
                  disabled={saving}
                  className={cn("h-8 text-xs font-medium", isVideoSelected && "bg-rose-600 hover:bg-rose-700")}
                >
                  {isVideoSelected ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                  {isVideoSelected ? 'Enabled' : 'Enable'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button size="sm" onClick={() => setIsFormatModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

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
