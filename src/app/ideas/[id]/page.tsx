'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Copy } from 'lucide-react';
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
      toast.error('Validation Error: Please select Eligible or Ineligible for all sections in the Publishing Checklist.');
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
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[600px] col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Idea not found. <Link href="/" className="text-primary hover:underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Content Editor</h1>
          <p className="text-muted-foreground mt-1 text-lg">Working on: <span className="text-foreground font-medium">{idea.idea}</span></p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-primary/25 transition-all">
          {saving ? <Skeleton className="w-4 h-4 mr-2 rounded-full" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card className="border-primary/10 shadow-md">
            <CardContent className="p-6">
              <Tabs defaultValue="baseArticle" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap rounded-lg p-1 bg-muted/50 mb-6 border">
                  <TabsTrigger value="baseArticle" className="flex-1">Base Article</TabsTrigger>
                  <TabsTrigger value="mediumArticle" className="flex-1">Tweets</TabsTrigger>
                  <TabsTrigger value="youtubeScript" className="flex-1">Video Script</TabsTrigger>
                </TabsList>

                {([
                  { value: 'baseArticle', label: 'Base Article', placeholder: 'Draft your core article here...' },
                  { value: 'mediumArticle', label: 'Tweets', placeholder: 'Draft your tweets here...' },
                  { value: 'youtubeScript', label: 'Video Script', placeholder: 'Long-form video script...' },
                ] as const).map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{tab.label}</h3>
                      </div>
                      <div className="relative group">
                        <Textarea 
                          placeholder={tab.placeholder}
                          value={(idea[tab.value as keyof IdeaDetails] as string) || ''}
                          onChange={(e) => handleTextChange(tab.value as keyof IdeaDetails, e.target.value)}
                          className="min-h-[500px] resize-y text-base p-4 pr-12 bg-background/50 focus:bg-background transition-colors leading-relaxed"
                        />
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shadow-sm"
                          onClick={() => handleCopyContent(idea[tab.value as keyof IdeaDetails] as string)}
                          title="Copy content"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Publishing Checklist */}
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-md sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle>Publishing Checklist</CardTitle>
              <CardDescription>Track where this content is live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { eligibleIds: ['eligibleX'], publishedIds: ['publishedX'], ineligibleIds: ['ineligibleX'], label: 'X (Twitter)' },
                { eligibleIds: ['eligibleMedium', 'eligibleSubstack'], publishedIds: ['publishedMedium', 'publishedSubstack'], ineligibleIds: ['ineligibleMedium', 'ineligibleSubstack'], label: 'Articles (Medium & Substack)' },
                { eligibleIds: ['eligibleYoutube', 'eligibleInstagram'], publishedIds: ['publishedYoutube', 'publishedInstagram'], ineligibleIds: ['ineligibleYoutube', 'ineligibleInstagram'], label: 'Videos (YouTube & Instagram)' },
              ].map((platform, idx) => {
                const isEligible = idea[platform.eligibleIds[0] as keyof IdeaDetails] as boolean;
                const isPublished = idea[platform.publishedIds[0] as keyof IdeaDetails] as boolean;
                const isIneligible = idea[platform.ineligibleIds[0] as keyof IdeaDetails] as boolean;
                return (
                  <div key={idx} className={`rounded-lg border border-border/50 p-3 space-y-3 transition-colors hover:border-primary/20 ${isIneligible ? 'bg-muted/30 border-muted' : ''}`}>
                    <p className={`text-sm font-semibold ${isIneligible ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{platform.label}</p>
                    
                    <div className="flex items-center space-x-3 group">
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
                        className="text-sm font-medium cursor-pointer group-hover:text-destructive transition-colors"
                      >
                        Ineligible (Skip)
                      </label>
                    </div>

                    <div className={`flex items-center space-x-3 group ${isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
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
                        className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors"
                      >
                        Eligible
                      </label>
                    </div>

                    <div className={`flex items-center space-x-3 group ${!isEligible || isIneligible ? 'opacity-40 pointer-events-none' : ''}`}>
                      <Checkbox
                        id={`published-${idx}`}
                        checked={isPublished}
                        disabled={!isEligible || isIneligible}
                        onCheckedChange={(checked) => handleCheckboxChange(platform.publishedIds as (keyof IdeaDetails)[], checked as boolean)}
                        className="h-4 w-4 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor={`published-${idx}`}
                        className="text-sm font-medium cursor-pointer group-hover:text-green-500 transition-colors"
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
