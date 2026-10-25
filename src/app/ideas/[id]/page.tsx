'use client';

import { useEffect, useState, useMemo, useRef, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Save, Copy, Loader2, Tv, FileText, Video, 
  BookOpen, Sparkles, Settings2, Check, X, Calendar, Clock, Film, 
  Scissors, Upload, CheckCircle2, Edit3 
} from 'lucide-react';
import { toast } from 'sonner';
import ScriptPrompter from '@/components/ScriptPrompter';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas, updateIdea } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';
import { cn } from 'cn';
import { getIdeaPublishStatus, canCompleteIdea, isIdeaCompleted } from '@/lib/ideaStatus';
import { Idea, OnboardingStep } from '@/types';
import { IdeaStatus } from '@/enums';

type IdeaDetails = Idea;

// Helpers for date/time conversion
function toDateTimeLocalValue(isoString?: string): string {
  if (!isoString) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatDateTimeDisplay(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

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

  // Video Stage Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [tempShootingDone, setTempShootingDone] = useState(false);
  const [tempShootingAt, setTempShootingAt] = useState('');
  const [tempEditingDone, setTempEditingDone] = useState(false);
  const [tempEditingAt, setTempEditingAt] = useState('');
  const [tempUploadedDone, setTempUploadedDone] = useState(false);
  const [tempUploadedAt, setTempUploadedAt] = useState('');

  // Inline date editing state
  const [editingDateKey, setEditingDateKey] = useState<keyof IdeaDetails | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');

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

  // Toggle Article Drafted state
  const handleToggleDraftedArticle = async () => {
    if (!idea) return;
    const newDone = !idea.articleDraftedDone;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        articleDraftedDone: newDone,
        articleDraftedAt: newDone ? (idea.articleDraftedAt || new Date().toISOString()) : '',
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(newDone ? 'Article marked as Drafted! ✓' : 'Article draft status cleared.');
    } catch (err: any) {
      toast.error('Failed to update article draft status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Article Published state
  const handleTogglePublishArticle = async () => {
    if (!idea) return;
    const currentPublished = Boolean(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack);
    const newPublished = !currentPublished;

    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        articlePublishedDone: newPublished,
        articlePublishedAt: newPublished ? (idea.articlePublishedAt || new Date().toISOString()) : '',
        publishedMedium: newPublished,
        publishedSubstack: newPublished,
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(newPublished ? 'Article marked as Published! ✓' : 'Article marked as unpublished.');
    } catch (err: any) {
      toast.error('Failed to update article status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Video Stages update modal
  const handleOpenVideoModal = () => {
    if (!idea) return;
    setTempShootingDone(Boolean(idea.videoShootingDone));
    setTempShootingAt(toDateTimeLocalValue(idea.videoShootingAt));
    setTempEditingDone(Boolean(idea.videoEditingDone));
    setTempEditingAt(toDateTimeLocalValue(idea.videoEditingAt));
    setTempUploadedDone(Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram));
    setTempUploadedAt(toDateTimeLocalValue(idea.videoUploadedAt));
    setIsVideoModalOpen(true);
  };

  // Save Video Stages from modal
  const handleSaveVideoModal = async () => {
    if (!idea) return;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        videoShootingDone: tempShootingDone,
        videoShootingAt: tempShootingDone ? (tempShootingAt ? new Date(tempShootingAt).toISOString() : new Date().toISOString()) : '',
        videoEditingDone: tempEditingDone,
        videoEditingAt: tempEditingDone ? (tempEditingAt ? new Date(tempEditingAt).toISOString() : new Date().toISOString()) : '',
        videoUploadedDone: tempUploadedDone,
        videoUploadedAt: tempUploadedDone ? (tempUploadedAt ? new Date(tempUploadedAt).toISOString() : new Date().toISOString()) : '',
        publishedYoutube: tempUploadedDone,
        publishedInstagram: tempUploadedDone,
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      setIsVideoModalOpen(false);
      toast.success('Video stages and timestamps updated successfully! ✓');
    } catch (err: any) {
      toast.error('Failed to update video stages: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick toggles for video stages
  const handleQuickToggleShooting = async () => {
    if (!idea) return;
    const newDone = !idea.videoShootingDone;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        videoShootingDone: newDone,
        videoShootingAt: newDone ? (idea.videoShootingAt || new Date().toISOString()) : '',
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(newDone ? 'Shooting marked as completed! ✓' : 'Shooting status cleared.');
    } catch (err: any) {
      toast.error('Failed to update shooting status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleEditing = async () => {
    if (!idea) return;
    const newDone = !idea.videoEditingDone;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        videoEditingDone: newDone,
        videoEditingAt: newDone ? (idea.videoEditingAt || new Date().toISOString()) : '',
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(newDone ? 'Editing marked as completed! ✓' : 'Editing status cleared.');
    } catch (err: any) {
      toast.error('Failed to update editing status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleUploaded = async () => {
    if (!idea) return;
    const currentUploaded = Boolean(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram);
    const newDone = !currentUploaded;
    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        videoUploadedDone: newDone,
        videoUploadedAt: newDone ? (idea.videoUploadedAt || new Date().toISOString()) : '',
        publishedYoutube: newDone,
        publishedInstagram: newDone,
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success(newDone ? 'Video marked as Uploaded / Published! ✓' : 'Upload status cleared.');
    } catch (err: any) {
      toast.error('Failed to update upload status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save inline timestamp edit
  const handleSaveInlineDate = async (field: keyof IdeaDetails) => {
    if (!idea) return;
    try {
      setSaving(true);
      const isoDate = editingDateValue ? new Date(editingDateValue).toISOString() : '';
      const updatedIdea: IdeaDetails = {
        ...idea,
        [field]: isoDate,
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      setEditingDateKey(null);
      toast.success('Timestamp updated successfully!');
    } catch (err: any) {
      toast.error('Failed to update timestamp: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Mark as Completed (Top Right Corner)
  const handleCompleteIdea = async () => {
    if (!idea) return;

    const alreadyCompleted = isIdeaCompleted(idea);
    if (alreadyCompleted) {
      try {
        setSaving(true);
        const updatedIdea: IdeaDetails = {
          ...idea,
          status: IdeaStatus.PENDING,
          datePosted: '',
        };
        setIdea(updatedIdea);
        await dispatch(updateIdea(updatedIdea));
        toast.info('Idea moved back to in-progress.');
      } catch (err: any) {
        toast.error('Failed to update status: ' + err.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    const check = canCompleteIdea(idea);
    if (!check.allowed) {
      toast.error(check.reason);
      return;
    }

    try {
      setSaving(true);
      const updatedIdea: IdeaDetails = {
        ...idea,
        status: IdeaStatus.POSTED,
        datePosted: new Date().toISOString(),
      };
      setIdea(updatedIdea);
      await dispatch(updateIdea(updatedIdea));
      toast.success('🎉 Idea totally completed! Excellent work!');
    } catch (err: any) {
      toast.error('Failed to complete idea: ' + err.message);
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

        <div className="flex items-center gap-2 flex-wrap">
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
            variant="outline"
            className="h-9 px-3.5 text-xs font-medium gap-1.5 border-border/80"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </Button>

          {/* Top Right Completed Button */}
          {idea && (() => {
            const completed = isIdeaCompleted(idea);
            const check = canCompleteIdea(idea);
            if (completed) {
              return (
                <Button
                  type="button"
                  onClick={handleCompleteIdea}
                  disabled={saving}
                  className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                  title="Idea is completed! Click if you want to reopen it"
                >
                  <Check className="w-4 h-4" />
                  <span>Completed ✓</span>
                </Button>
              );
            }
            if (check.allowed) {
              return (
                <Button
                  type="button"
                  onClick={handleCompleteIdea}
                  disabled={saving}
                  className="h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse hover:animate-none cursor-pointer"
                  title="All required formats are published! Click to finalize as Completed"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete Idea</span>
                </Button>
              );
            }
            return (
              <Button
                type="button"
                onClick={handleCompleteIdea}
                disabled={saving}
                variant="outline"
                className="h-9 px-3.5 text-xs font-medium gap-1.5 border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
                title={check.reason}
              >
                <Check className="w-4 h-4 opacity-40" />
                <span>Complete Idea</span>
              </Button>
            );
          })()}
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

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {/* Video Stage Prompt button */}
                        {isVideoScript && (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={handleOpenVideoModal}
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
                            onClick={() => setIsPrompterOpen(true)}
                            className="h-7.5 px-2.5 text-xs font-medium gap-1.5 border-border/70 hover:bg-muted"
                            title="Open full-screen prompter for recording from a distance"
                          >
                            <Tv className="h-3.5 w-3.5 text-rose-500" />
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

                    {/* Article Stage Progression Banner */}
                    {tab.value === 'mediumArticle' && (
                      <div className="mb-3 p-2.5 sm:p-3 rounded-xl border border-border/75 bg-muted/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Article Stages:
                          </span>

                          {/* Stage 1: Drafted */}
                          <div className={cn(
                            "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors",
                            idea.articleDraftedDone 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                              : "bg-card border-border/70 text-muted-foreground"
                          )}>
                            <button
                              type="button"
                              onClick={handleToggleDraftedArticle}
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                            >
                              <span className={cn("w-2 h-2 rounded-full", idea.articleDraftedDone ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                              <span>{idea.articleDraftedDone ? "1. Drafted ✓" : "1. Mark as Drafted"}</span>
                            </button>
                            {idea.articleDraftedDone && (
                              <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                                <span className="opacity-80">{formatDateTimeDisplay(idea.articleDraftedAt) || 'Recorded'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDateKey('articleDraftedAt');
                                    setEditingDateValue(toDateTimeLocalValue(idea.articleDraftedAt));
                                  }}
                                  className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                  title="Edit date & time"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stage 2: Published */}
                          <div className={cn(
                            "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors",
                            (idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack)
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                              : "bg-card border-border/70 text-muted-foreground"
                          )}>
                            <button
                              type="button"
                              onClick={handleTogglePublishArticle}
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                            >
                              <span className={cn("w-2 h-2 rounded-full", (idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack) ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                              <span>{(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack) ? "2. Published ✓" : "2. Mark as Published"}</span>
                            </button>
                            {(idea.articlePublishedDone || idea.publishedMedium || idea.publishedSubstack) && (
                              <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                                <span className="opacity-80">{formatDateTimeDisplay(idea.articlePublishedAt) || 'Recorded'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDateKey('articlePublishedAt');
                                    setEditingDateValue(toDateTimeLocalValue(idea.articlePublishedAt));
                                  }}
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
                          <div className={cn(
                            "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors",
                            idea.videoShootingDone
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                              : "bg-card border-border/70 text-muted-foreground"
                          )}>
                            <button
                              type="button"
                              onClick={handleQuickToggleShooting}
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                            >
                              <Film className="w-3 h-3 opacity-70" />
                              <span>{idea.videoShootingDone ? "1. Shooting ✓" : "1. Shooting Pending"}</span>
                            </button>
                            {idea.videoShootingDone && (
                              <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                                <span className="opacity-80">{formatDateTimeDisplay(idea.videoShootingAt) || 'Recorded'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDateKey('videoShootingAt');
                                    setEditingDateValue(toDateTimeLocalValue(idea.videoShootingAt));
                                  }}
                                  className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                  title="Edit date & time"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stage 2: Editing */}
                          <div className={cn(
                            "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors",
                            idea.videoEditingDone
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                              : "bg-card border-border/70 text-muted-foreground"
                          )}>
                            <button
                              type="button"
                              onClick={handleQuickToggleEditing}
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                            >
                              <Scissors className="w-3 h-3 opacity-70" />
                              <span>{idea.videoEditingDone ? "2. Editing ✓" : "2. Editing Pending"}</span>
                            </button>
                            {idea.videoEditingDone && (
                              <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                                <span className="opacity-80">{formatDateTimeDisplay(idea.videoEditingAt) || 'Recorded'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDateKey('videoEditingAt');
                                    setEditingDateValue(toDateTimeLocalValue(idea.videoEditingAt));
                                  }}
                                  className="text-primary hover:underline p-0.5 ml-0.5 cursor-pointer"
                                  title="Edit date & time"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stage 3: Uploaded */}
                          <div className={cn(
                            "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-colors",
                            (idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram)
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                              : "bg-card border-border/70 text-muted-foreground"
                          )}>
                            <button
                              type="button"
                              onClick={handleQuickToggleUploaded}
                              className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 font-semibold"
                            >
                              <Upload className="w-3 h-3 opacity-70" />
                              <span>{(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram) ? "3. Uploaded ✓" : "3. Upload Pending"}</span>
                            </button>
                            {(idea.videoUploadedDone || idea.publishedYoutube || idea.publishedInstagram) && (
                              <div className="flex items-center gap-1 pl-1.5 border-l border-border/60 text-[11px]">
                                <span className="opacity-80">{formatDateTimeDisplay(idea.videoUploadedAt) || 'Recorded'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDateKey('videoUploadedAt');
                                    setEditingDateValue(toDateTimeLocalValue(idea.videoUploadedAt));
                                  }}
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
                          onClick={handleOpenVideoModal}
                          className="h-7 text-xs font-semibold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 p-1.5 shrink-0"
                          title="Open full stages dialog"
                        >
                          <Film className="w-3.5 h-3.5" />
                          Update Stages &amp; Timestamps
                        </Button>
                      </div>
                    )}

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

      {/* Video Production Stages Update Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Update Video Production Stages</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Answer the stage questions and adjust the recorded date &amp; time anytime.
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsVideoModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Question 1: Shooting Completed? */}
              <div className={cn(
                "p-3.5 rounded-xl border transition-all space-y-3",
                tempShootingDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/70 bg-muted/20"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", tempShootingDone ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">1. Is shooting completed?</h4>
                      <p className="text-xs text-muted-foreground">Video footage recording finished</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={tempShootingDone ? "default" : "outline"}
                    onClick={() => {
                      const next = !tempShootingDone;
                      setTempShootingDone(next);
                      if (next && !tempShootingAt) {
                        setTempShootingAt(toDateTimeLocalValue());
                      }
                    }}
                    className={cn("h-8 text-xs font-semibold gap-1", tempShootingDone && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                  >
                    {tempShootingDone ? <Check className="w-3.5 h-3.5" /> : null}
                    {tempShootingDone ? "Completed ✓" : "Mark Done"}
                  </Button>
                </div>

                {tempShootingDone && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Shooting Date &amp; Time (editable at your will):
                    </label>
                    <Input
                      type="datetime-local"
                      value={tempShootingAt}
                      onChange={(e) => setTempShootingAt(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                )}
              </div>

              {/* Question 2: Editing Completed? */}
              <div className={cn(
                "p-3.5 rounded-xl border transition-all space-y-3",
                tempEditingDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/70 bg-muted/20"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", tempEditingDone ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">2. Is editing completed?</h4>
                      <p className="text-xs text-muted-foreground">Cut, sound, color &amp; graphics finalized</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={tempEditingDone ? "default" : "outline"}
                    onClick={() => {
                      const next = !tempEditingDone;
                      setTempEditingDone(next);
                      if (next && !tempEditingAt) {
                        setTempEditingAt(toDateTimeLocalValue());
                      }
                    }}
                    className={cn("h-8 text-xs font-semibold gap-1", tempEditingDone && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                  >
                    {tempEditingDone ? <Check className="w-3.5 h-3.5" /> : null}
                    {tempEditingDone ? "Completed ✓" : "Mark Done"}
                  </Button>
                </div>

                {tempEditingDone && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Editing Date &amp; Time (editable at your will):
                    </label>
                    <Input
                      type="datetime-local"
                      value={tempEditingAt}
                      onChange={(e) => setTempEditingAt(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                )}
              </div>

              {/* Question 3: Uploaded? */}
              <div className={cn(
                "p-3.5 rounded-xl border transition-all space-y-3",
                tempUploadedDone ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/70 bg-muted/20"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg", tempUploadedDone ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">3. Is video uploaded?</h4>
                      <p className="text-xs text-muted-foreground">Published / scheduled to YouTube or channel</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={tempUploadedDone ? "default" : "outline"}
                    onClick={() => {
                      const next = !tempUploadedDone;
                      setTempUploadedDone(next);
                      if (next && !tempUploadedAt) {
                        setTempUploadedAt(toDateTimeLocalValue());
                      }
                    }}
                    className={cn("h-8 text-xs font-semibold gap-1", tempUploadedDone && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                  >
                    {tempUploadedDone ? <Check className="w-3.5 h-3.5" /> : null}
                    {tempUploadedDone ? "Uploaded ✓" : "Mark Done"}
                  </Button>
                </div>

                {tempUploadedDone && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Upload Date &amp; Time (editable at your will):
                    </label>
                    <Input
                      type="datetime-local"
                      value={tempUploadedAt}
                      onChange={(e) => setTempUploadedAt(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveVideoModal}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Video Stages
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Date & Time Editor Modal */}
      {editingDateKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Update Timestamp</h4>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditingDateKey(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Select or adjust custom date and time:
              </label>
              <Input
                type="datetime-local"
                value={editingDateValue}
                onChange={(e) => setEditingDateValue(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingDateKey(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveInlineDate(editingDateKey)}
                disabled={saving}
                className="font-medium px-3.5"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save Time
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
