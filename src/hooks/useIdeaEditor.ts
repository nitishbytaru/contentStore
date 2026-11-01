'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useGetIdeaByIdQuery, useUpdateIdeaMutation } from '@/store/api/ideasApi';
import { getIdeaPublishStatus, isIdeaCompleted } from '@/utils/ideaStatus';
import { Idea } from '@/types';
import { IdeaStatus } from '@/enums';
import { BookOpen, FileText, Video } from 'lucide-react';

export function useIdeaEditor(ideaId: string) {
  const { data: fetchedIdea, isLoading: ideaLoading } = useGetIdeaByIdQuery(ideaId);
  const [updateIdeaMutation] = useUpdateIdeaMutation();

  const handleUpdateIdea = async (updatedData: Partial<Idea> & { ideaId: string }) => {
    return await updateIdeaMutation(updatedData).unwrap();
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<Idea | null>(null);

  const [activeContentTab, setActiveContentTab] = useState<string>('baseArticle');
  const [isPrompterOpen, setIsPrompterOpen] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  // Initialize and load idea from RTK Query
  useEffect(() => {
    if (fetchedIdea) {
      setIdea(fetchedIdea as Idea);
      setLoading(false);
    } else if (!ideaLoading) {
      setLoading(false);
    }
  }, [fetchedIdea, ideaLoading]);

  // Determine enabled formats
  const isArticleSelected = Boolean(
    idea && (idea.eligibleMedium || idea.eligibleSubstack || (idea.mediumArticle && idea.mediumArticle.trim().length > 0))
  );

  const isVideoSelected = Boolean(
    idea && (idea.eligibleYoutube || idea.eligibleInstagram || (idea.youtubeScript && idea.youtubeScript.trim().length > 0))
  );

  // Dynamic content tabs based on questions answered
  const contentTabs = useMemo(() => {
    const tabs: Array<{
      value: 'baseArticle' | 'mediumArticle' | 'youtubeScript';
      label: string;
      icon: any;
      placeholder: string;
    }> = [
      {
        value: 'baseArticle',
        label: 'Research',
        icon: BookOpen,
        placeholder: 'Draft your research notes, outlines, and key insights here...',
      },
    ];

    if (isArticleSelected) {
      tabs.push({
        value: 'mediumArticle',
        label: 'Article',
        icon: FileText,
        placeholder: 'Draft your Medium/Substack article here...',
      });
    }

    if (isVideoSelected) {
      tabs.push({
        value: 'youtubeScript',
        label: 'Video Script',
        icon: Video,
        placeholder: 'Write your video script here... (use prompter to record)',
      });
    }

    return tabs;
  }, [isArticleSelected, isVideoSelected]);

  // Ensure active tab is always valid
  useEffect(() => {
    if (contentTabs.length > 0 && !contentTabs.some((t) => t.value === activeContentTab)) {
      setActiveContentTab(contentTabs[0].value);
    }
  }, [contentTabs, activeContentTab]);

  const handleSave = async () => {
    if (!idea) return;

    try {
      setSaving(true);
      await handleUpdateIdea(idea);
      toast.success('Changes saved successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to save: ' + message);
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (field: keyof Idea, value: string) => {
    setIdea((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCopyContent = (text: string) => {
    if (!text) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };



  // Reconfigure formats from workspace
  const handleToggleFormat = async (format: 'article' | 'video', enable: boolean) => {
    if (!idea) return;
    try {
      setSaving(true);
      const updatedIdea: Idea = {
        ...idea,
        ...(format === 'article'
          ? {
              eligibleMedium: enable,
              eligibleSubstack: enable,
              ineligibleMedium: !enable,
              ineligibleSubstack: !enable,
            }
          : {
              eligibleYoutube: enable,
              eligibleInstagram: enable,
              ineligibleYoutube: !enable,
              ineligibleInstagram: !enable,
            }),
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
      toast.success(`${format === 'article' ? 'Article' : 'Video'} tab ${enable ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error('Failed to update formats: ' + err.message);
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
        const updatedIdea: Idea = {
          ...idea,
          status: IdeaStatus.PENDING,
          datePosted: '',
        };
        setIdea(updatedIdea);
        await handleUpdateIdea(updatedIdea);
        toast.info('Idea moved back to in-progress.');
      } catch (err: any) {
        toast.error('Failed to update status: ' + err.message);
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      setSaving(true);
      const updatedIdea: Idea = {
        ...idea,
        status: IdeaStatus.POSTED,
        datePosted: new Date().toISOString(),
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
      toast.success('🎉 Idea totally completed! Excellent work!');
    } catch (err: any) {
      toast.error('Failed to complete idea: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const publishStatus = idea ? getIdeaPublishStatus(idea) : null;

  return {
    idea,
    loading: loading || ideaLoading,
    saving,
    activeContentTab,
    setActiveContentTab,
    contentTabs,
    isArticleSelected,
    isVideoSelected,
    publishStatus,
    isPrompterOpen,
    setIsPrompterOpen,
    isFormatModalOpen,
    setIsFormatModalOpen,
    handleSave,
    handleTextChange,
    handleCopyContent,
    handleToggleFormat,
    handleCompleteIdea,
  };
}
