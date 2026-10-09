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

  const handleCheckboxChange = (field: keyof IdeaDetails, checked: boolean) => {
    setIdea(prev => prev ? { ...prev, [field]: checked } : prev);
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
                  <TabsTrigger value="mediumArticle" className="flex-1">Medium Article</TabsTrigger>
                  <TabsTrigger value="youtubeScript" className="flex-1">YouTube Script</TabsTrigger>
                </TabsList>

                {([
                  { value: 'baseArticle', label: 'Base Article', placeholder: 'Draft your core article here...' },
                  { value: 'mediumArticle', label: 'Medium Article', placeholder: 'Draft the Medium-optimized version here...' },
                  { value: 'youtubeScript', label: 'YouTube Script', placeholder: 'Long-form YouTube video script...' },
                ] as const).map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">{tab.label}</h3>
                      </div>
                      <div className="relative group">
                        <Textarea 
                          placeholder={tab.placeholder}
                          value={idea[tab.value as keyof IdeaDetails] as string}
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
            <CardContent className="space-y-6">
              {[
                { id: 'publishedX', label: 'Published on X (Twitter)' },
                { id: 'publishedMedium', label: 'Published on Medium' },
                { id: 'publishedSubstack', label: 'Published on Substack' },
                { id: 'publishedYoutube', label: 'Published on YouTube' },
                { id: 'publishedInstagram', label: 'Published on Instagram' },
              ].map(platform => (
                <div key={platform.id} className="flex items-start space-x-3 group">
                  <Checkbox 
                    id={platform.id}
                    checked={idea[platform.id as keyof IdeaDetails] as boolean}
                    onCheckedChange={(checked) => handleCheckboxChange(platform.id as keyof IdeaDetails, checked as boolean)}
                    className="mt-1 h-5 w-5 data-[state=checked]:bg-primary"
                  />
                  <div className="space-y-1 leading-none flex-1">
                    <label 
                      htmlFor={platform.id}
                      className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors"
                    >
                      {platform.label}
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
