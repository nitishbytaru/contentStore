'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Copy, Loader2 } from 'lucide-react';
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
  const router = useRouter();
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
      // Not in store, fetch it all or just the one. The slice fetchIdeas gets all.
      const loadData = async () => {
        setLoading(true);
        const result = await dispatch(fetchIdeas());
        if (fetchIdeas.fulfilled.match(result)) {
          const found = result.payload.find((i: any) => i.id === id);
          if (found) {
            setIdea(found as IdeaDetails);
          }
        }
        setLoading(false);
      };
      loadData();
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
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
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
      const updates = {} as any;
      fields.forEach(f => updates[f] = checked);
      return { ...prev, ...updates };
    });
  };

  if (loading || storeLoading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          <div className="space-y-4">
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
      <div className="py-12 text-center text-muted-foreground">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <Link href="/ideas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Ideas
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              Working on: <span className="text-foreground font-medium">{idea.idea}</span>
            </p>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" 
              onClick={() => handleCopyContent(idea.idea)}
              title="Copy idea text"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto shrink-0">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="baseArticle" className="w-full">
                <TabsList className="w-full justify-start rounded-lg p-1 bg-muted/50 mb-4 border border-border/50">
                  {contentTabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {contentTabs.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                    <div className="relative group">
                      <Textarea 
                        placeholder={tab.placeholder}
                        value={(idea[tab.value as keyof IdeaDetails] as string) || ''}
                        onChange={(e) => handleTextChange(tab.value as keyof IdeaDetails, e.target.value)}
                        className="min-h-[350px] md:min-h-[450px] resize-y text-sm p-4 pr-12 leading-relaxed"
                        style={{ fieldSizing: 'fixed' } as any}
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
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
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publishing Checklist</CardTitle>
              <CardDescription className="text-xs">Track where this content is live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {platforms.map((platform, idx) => {
                const isEligible = idea[platform.eligibleIds[0] as keyof IdeaDetails] as boolean;
                const isPublished = idea[platform.publishedIds[0] as keyof IdeaDetails] as boolean;
                const isIneligible = idea[platform.ineligibleIds[0] as keyof IdeaDetails] as boolean;
                return (
                  <div key={idx} className={`rounded-lg border p-3 space-y-2.5 transition-colors ${isIneligible ? 'bg-muted/30 border-muted' : 'border-border/50 hover:border-border'}`}>
                    <p className={`text-sm font-medium ${isIneligible ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{platform.label}</p>
                    
                    <div className="flex items-center gap-2.5">
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
                        className="h-4 w-4 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                      />
                      <label
                        htmlFor={`ineligible-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Ineligible (Skip)
                      </label>
                    </div>

                    <div className={`flex items-center gap-2.5 ${isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
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
                        className="h-4 w-4 data-[state=checked]:bg-primary"
                      />
                      <label
                        htmlFor={`eligible-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                      >
                        Eligible
                      </label>
                    </div>

                    <div className={`flex items-center gap-2.5 ${!isEligible || isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
                      <Checkbox
                        id={`published-${idx}`}
                        checked={isPublished}
                        disabled={!isEligible || isIneligible}
                        onCheckedChange={(checked) => handleCheckboxChange(platform.publishedIds as (keyof IdeaDetails)[], checked as boolean)}
                        className="h-4 w-4 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor={`published-${idx}`}
                        className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-green-500 transition-colors"
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
