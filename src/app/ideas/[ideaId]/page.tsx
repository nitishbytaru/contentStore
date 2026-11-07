'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import ScriptPrompter from '@/components/ScriptPrompter';
import { useIdeaEditor } from '@/hooks';
import {
  IdeaEditorSkeleton,
  IdeaEditorHeader,
  IdeaContentTabs,
  IdeaFormatModal,
} from '@/components/idea-detail';
import { ArticleWritingOverlay } from '@/components/idea-detail/ArticlePromptButton';
import { cn } from 'cn';
import { Lightbulb, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/StatusPage';

export default function IdeaEditor({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = use(params);
  const [clearingResearch, setClearingResearch] = useState(false);
  const [applyingPrompt, setApplyingPrompt] = useState(false);
  const pageLocked = clearingResearch || applyingPrompt;
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
    handleSave,
    handleDeleteIdea,
    handleTextChange,
    handleCopyContent,
    handleToggleFormat,
    handleCompleteIdea,
  } = useIdeaEditor(ideaId);

  if (loading) {
    return <IdeaEditorSkeleton />;
  }

  if (!idea) {
    return (
      <StatusPage
        code="404"
        icon={SearchX}
        title="Idea not found"
        description="This idea doesn't exist or may have been deleted. It might also belong to a different account."
        actions={
          <Button nativeButton={false} render={<Link href="/ideas" />}>
            <Lightbulb data-icon="inline-start" />
            Back to my ideas
          </Button>
        }
      />
    );
  }

  // WORKSPACE WITH DYNAMIC TABS
  return (
    <>
    <div
      inert={pageLocked ? true : undefined}
      className={cn(
        'w-full max-w-full min-w-0 overflow-x-hidden',
        pageLocked && '[&_button]:pointer-events-none [&_button]:opacity-50 [&_a]:pointer-events-none [&_a]:opacity-50 [&_[role=tab]]:pointer-events-none [&_[role=tab]]:opacity-50 [&_textarea]:pointer-events-none'
      )}
    >
      <div className="sticky top-0 z-40 -mx-4 md:-mx-6 -mt-6 md:-mt-8 mb-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 md:px-6">
          <IdeaEditorHeader
            idea={idea}
            saving={saving}
            isArticleSelected={isArticleSelected}
            isVideoSelected={isVideoSelected}
            onOpenFormatModal={() => setIsFormatModalOpen(true)}
            onSave={handleSave}
            onCompleteIdea={handleCompleteIdea}
            onCopyTitle={handleCopyContent}
            onDeleteIdea={handleDeleteIdea}
            locked={pageLocked}
          />
        </div>
      </div>

      {/* Main Content Area - Full width with dynamic navigation tabs */}
      <IdeaContentTabs
        idea={idea}
        activeContentTab={activeContentTab}
        contentTabs={contentTabs}
        onTabChange={setActiveContentTab}
        onTextChange={handleTextChange}
        onCopyContent={handleCopyContent}
        onOpenPrompter={() => setIsPrompterOpen(true)}
        onResearchClearing={setClearingResearch}
        onApplyingPrompt={setApplyingPrompt}
        locked={pageLocked}
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

      {/* Fullscreen Video Script Prompter */}
      <ScriptPrompter
        isOpen={isPrompterOpen}
        onClose={() => setIsPrompterOpen(false)}
        title={idea.idea}
        script={idea.youtubeScript || ''}
      />
    </div>
    {applyingPrompt && <ArticleWritingOverlay />}
    </>
  );
}
