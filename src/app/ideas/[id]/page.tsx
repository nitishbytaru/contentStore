'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Copy, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIdeas, updateIdea } from '@/store/slices/ideasSlice';
import { AppDispatch, RootState } from '@/store';

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
    { value: 'baseArticle', label: 'Base Article', placeholder: 'Draft your core article here...' },
    { value: 'mediumArticle', label: 'Tweets', placeholder: 'Draft your tweets here...' },
    { value: 'youtubeScript', label: 'Video Script', placeholder: 'Long-form video script...' },
  ] as const;

  const platforms = [
    { eligibleIds: ['eligibleX'], publishedIds: ['publishedX'], ineligibleIds: ['ineligibleX'], label: 'X (Twitter)' },
    { eligibleIds: ['eligibleMedium', 'eligibleSubstack'], publishedIds: ['publishedMedium', 'publishedSubstack'], ineligibleIds: ['ineligibleMedium', 'ineligibleSubstack'], label: 'Articles (Medium & Substack)' },
    { eligibleIds: ['eligibleYoutube', 'eligibleInstagram'], publishedIds: ['publishedYoutube', 'publishedInstagram'], ineligibleIds: ['ineligibleYoutube', 'ineligibleInstagram'], label: 'Videos (YouTube & Instagram)' },
  ];

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
      <div className="w-full min-w-0 rounded-xl border border-border/70 bg-card/75 backdrop-blur-sm p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Working on</span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground break-words [overflow-wrap:anywhere] leading-snug">
              {idea.idea}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-border/80 shrink-0" 
              onClick={() => handleCopyContent(idea.idea)}
              title="Copy idea text"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Idea</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Main Content Area */}
        <div className="lg:col-span-2 w-full min-w-0">
          <Card className="w-full min-w-0 overflow-hidden shadow-xs border-border/70">
            <CardContent className="p-3.5 sm:p-6 w-full min-w-0 overflow-hidden">
              <Tabs defaultValue="baseArticle" className="w-full min-w-0">
                <TabsList className="grid grid-cols-3 w-full rounded-lg p-1 bg-muted/60 mb-4 border border-border/50 h-auto min-w-0">
                  {contentTabs.map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="text-xs sm:text-sm py-2 px-1 sm:px-3 text-center truncate min-w-0 font-medium"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {contentTabs.map(tab => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="focus-visible:outline-none focus-visible:ring-0 mt-0 w-full min-w-0"
                  >
                    <div className="relative group w-full min-w-0">
                      <Textarea 
                        placeholder={tab.placeholder}
                        value={(idea[tab.value as keyof IdeaDetails] as string) || ''}
                        onChange={(e) => handleTextChange(tab.value as keyof IdeaDetails, e.target.value)}
                        className="min-h-[350px] md:min-h-[450px] w-full max-w-full resize-y text-sm p-3.5 sm:p-4 pr-10 sm:pr-12 leading-relaxed break-words overflow-x-hidden [field-sizing:fixed]"
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="absolute top-3 right-3 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 shadow-xs"
                        onClick={() => handleCopyContent(idea[tab.value as keyof IdeaDetails] as string)}
                        title="Copy content"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
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
    </div>
  );
}
