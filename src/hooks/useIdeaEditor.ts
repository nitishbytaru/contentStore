'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useGetIdeaByIdQuery, useUpdateIdeaMutation } from '@/store/api/ideasApi';
import { getIdeaPublishStatus, canCompleteIdea, isIdeaCompleted } from '@/utils/ideaStatus';
import { toDateTimeLocalValue } from '@/utils/dateTime';
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

  // Video Stage Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [tempShootingDone, setTempShootingDone] = useState(false);
  const [tempShootingAt, setTempShootingAt] = useState('');
  const [tempEditingDone, setTempEditingDone] = useState(false);
  const [tempEditingAt, setTempEditingAt] = useState('');
  const [tempUploadedDone, setTempUploadedDone] = useState(false);
  const [tempUploadedAt, setTempUploadedAt] = useState('');

  // Inline date editing state
  const [editingDateKey, setEditingDateKey] = useState<keyof Idea | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');

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

  // Toggle Article Drafted state
  const handleToggleDraftedArticle = async () => {
    if (!idea) return;
    const newDone = !idea.articleDraftedDone;
    try {
      setSaving(true);
      const updatedIdea: Idea = {
        ...idea,
        articleDraftedDone: newDone,
        articleDraftedAt: newDone ? idea.articleDraftedAt || new Date().toISOString() : '',
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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
      const updatedIdea: Idea = {
        ...idea,
        articlePublishedDone: newPublished,
        articlePublishedAt: newPublished ? idea.articlePublishedAt || new Date().toISOString() : '',
        publishedMedium: newPublished,
        publishedSubstack: newPublished,
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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
      const updatedIdea: Idea = {
        ...idea,
        videoShootingDone: tempShootingDone,
        videoShootingAt: tempShootingDone
          ? tempShootingAt
            ? new Date(tempShootingAt).toISOString()
            : new Date().toISOString()
          : '',
        videoEditingDone: tempEditingDone,
        videoEditingAt: tempEditingDone
          ? tempEditingAt
            ? new Date(tempEditingAt).toISOString()
            : new Date().toISOString()
          : '',
        videoUploadedDone: tempUploadedDone,
        videoUploadedAt: tempUploadedDone
          ? tempUploadedAt
            ? new Date(tempUploadedAt).toISOString()
            : new Date().toISOString()
          : '',
        publishedYoutube: tempUploadedDone,
        publishedInstagram: tempUploadedDone,
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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
      const updatedIdea: Idea = {
        ...idea,
        videoShootingDone: newDone,
        videoShootingAt: newDone ? idea.videoShootingAt || new Date().toISOString() : '',
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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
      const updatedIdea: Idea = {
        ...idea,
        videoEditingDone: newDone,
        videoEditingAt: newDone ? idea.videoEditingAt || new Date().toISOString() : '',
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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
      const updatedIdea: Idea = {
        ...idea,
        videoUploadedDone: newDone,
        videoUploadedAt: newDone ? idea.videoUploadedAt || new Date().toISOString() : '',
        publishedYoutube: newDone,
        publishedInstagram: newDone,
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
      toast.success(newDone ? 'Video marked as Uploaded / Published! ✓' : 'Upload status cleared.');
    } catch (err: any) {
      toast.error('Failed to update upload status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save inline timestamp edit
  const handleSaveInlineDate = async (field: keyof Idea) => {
    if (!idea) return;
    try {
      setSaving(true);
      const isoDate = editingDateValue ? new Date(editingDateValue).toISOString() : '';
      const updatedIdea: Idea = {
        ...idea,
        [field]: isoDate,
      };
      setIdea(updatedIdea);
      await handleUpdateIdea(updatedIdea);
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

    const check = canCompleteIdea(idea);
    if (!check.allowed) {
      toast.error(check.reason);
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
    isVideoModalOpen,
    setIsVideoModalOpen,
    tempShootingDone,
    setTempShootingDone,
    tempShootingAt,
    setTempShootingAt,
    tempEditingDone,
    setTempEditingDone,
    tempEditingAt,
    setTempEditingAt,
    tempUploadedDone,
    setTempUploadedDone,
    tempUploadedAt,
    setTempUploadedAt,
    editingDateKey,
    setEditingDateKey,
    editingDateValue,
    setEditingDateValue,
    handleSave,
    handleTextChange,
    handleCopyContent,
    handleToggleFormat,
    handleToggleDraftedArticle,
    handleTogglePublishArticle,
    handleQuickToggleShooting,
    handleQuickToggleEditing,
    handleQuickToggleUploaded,
    handleSaveInlineDate,
    handleCompleteIdea,
    handleOpenVideoModal,
    handleSaveVideoModal,
  };
}
