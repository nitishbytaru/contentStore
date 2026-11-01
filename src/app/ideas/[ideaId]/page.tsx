'use client';

import { use } from 'react';
import Link from 'next/link';
import ScriptPrompter from '@/components/ScriptPrompter';
import { useIdeaEditor } from '@/hooks';
import {
  IdeaEditorSkeleton,
  IdeaEditorHeader,
  IdeaContentTabs,
  IdeaFormatModal,
  IdeaVideoStagesModal,
  IdeaTimestampModal,
} from '@/components/idea-detail';

export default function IdeaEditor({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = use(params);
  const {
    idea,
    loading,
    saving,
    activeContentTab,
    setActiveContentTab,
    contentTabs,
    isArticleSelected,
    isVideoSelected,
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
  } = useIdeaEditor(ideaId);

  if (loading) {
    return <IdeaEditorSkeleton />;
  }

  if (!idea) {
    return (
      <div className="py-12 text-center text-muted-foreground w-full">
        Idea not found.{' '}
        <Link href="/ideas" className="text-primary hover:underline">
          Go back to Ideas
        </Link>
      </div>
    );
  }

  // WORKSPACE WITH DYNAMIC TABS
  return (
    <div className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
      <IdeaEditorHeader
        idea={idea}
        saving={saving}
        isArticleSelected={isArticleSelected}
        isVideoSelected={isVideoSelected}
        onOpenFormatModal={() => setIsFormatModalOpen(true)}
        onSave={handleSave}
        onCompleteIdea={handleCompleteIdea}
        onCopyTitle={handleCopyContent}
      />

      {/* Main Content Area - Full width with dynamic navigation tabs */}
      <IdeaContentTabs
        idea={idea}
        activeContentTab={activeContentTab}
        contentTabs={contentTabs}
        onTabChange={setActiveContentTab}
        onTextChange={handleTextChange}
        onCopyContent={handleCopyContent}
        onOpenPrompter={() => setIsPrompterOpen(true)}
        onOpenVideoModal={handleOpenVideoModal}
        onToggleDraftedArticle={handleToggleDraftedArticle}
        onTogglePublishArticle={handleTogglePublishArticle}
        onQuickToggleShooting={handleQuickToggleShooting}
        onQuickToggleEditing={handleQuickToggleEditing}
        onQuickToggleUploaded={handleQuickToggleUploaded}
        onEditDateKey={(key, currentVal) => {
          setEditingDateKey(key);
          setEditingDateValue(currentVal);
        }}
      />

      {/* Format Configuration Dialog */}
      <IdeaFormatModal
        isOpen={isFormatModalOpen}
        isArticleSelected={isArticleSelected}
        isVideoSelected={isVideoSelected}
        saving={saving}
        onClose={() => setIsFormatModalOpen(false)}
        onToggleFormat={handleToggleFormat}
      />

      {/* Video Production Stages Update Modal */}
      <IdeaVideoStagesModal
        isOpen={isVideoModalOpen}
        saving={saving}
        tempShootingDone={tempShootingDone}
        tempShootingAt={tempShootingAt}
        tempEditingDone={tempEditingDone}
        tempEditingAt={tempEditingAt}
        tempUploadedDone={tempUploadedDone}
        tempUploadedAt={tempUploadedAt}
        onClose={() => setIsVideoModalOpen(false)}
        onSave={handleSaveVideoModal}
        setTempShootingDone={setTempShootingDone}
        setTempShootingAt={setTempShootingAt}
        setTempEditingDone={setTempEditingDone}
        setTempEditingAt={setTempEditingAt}
        setTempUploadedDone={setTempUploadedDone}
        setTempUploadedAt={setTempUploadedAt}
      />

      {/* Inline Date & Time Editor Modal */}
      <IdeaTimestampModal
        editingDateKey={editingDateKey}
        editingDateValue={editingDateValue}
        saving={saving}
        onClose={() => setEditingDateKey(null)}
        onDateValueChange={setEditingDateValue}
        onSaveDate={handleSaveInlineDate}
      />

      {/* Fullscreen Video Script Prompter */}
      <ScriptPrompter
        isOpen={isPrompterOpen}
        onClose={() => setIsPrompterOpen(false)}
        title={idea.idea}
        script={idea.youtubeScript || ''}
      />
    </div>
  );
}
