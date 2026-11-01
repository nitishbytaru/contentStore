'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, FileUp, Send, Sparkles, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useClearResearchMutation,
  useGenerateArticleMutation,
  useGetResearchMessagesQuery,
  useSendResearchMutation,
  useUploadResearchPdfMutation,
  useUploadResearchTextMutation,
} from '@/store/api/ideasApi';
import { cn } from 'cn';

function readable(text: string) {
  return text
    .replace(/\[\d+[^\]]*\]/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\*\*|__|[*_`#>]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ResearchChat({
  ideaId,
  title,
  onArticleGenerated,
}: {
  ideaId: string;
  title: string;
  onArticleGenerated?: (article: string) => void;
}) {
  const { data: messages = [], isLoading } = useGetResearchMessagesQuery(ideaId);
  const [sendResearch, { isLoading: isSending }] = useSendResearchMutation();
  const [clearResearch, { isLoading: isClearing }] = useClearResearchMutation();
  const [generateArticle, { isLoading: isGenerating }] = useGenerateArticleMutation();
  const [uploadPdf, { isLoading: isUploading }] = useUploadResearchPdfMutation();
  const [uploadText, { isLoading: isUploadingText }] = useUploadResearchTextMutation();
  const [draft, setDraft] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [contextText, setContextText] = useState('');
  const [pending, setPending] = useState<{ role: 'user' | 'source'; content: string } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const busy = isSending || isUploading || isUploadingText || isGenerating || isClearing;
  const hasConversation = messages.some((message) => message.role === 'user' || message.role === 'assistant');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy, pending]);

  const errorText = (err: unknown) => {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data?: { error?: string } }).data;
      if (data?.error) return data.error;
    }
    return 'Research could not be saved';
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    setPending({ role: 'user', content });
    setDraft('');
    try {
      await sendResearch({ ideaId, content, mode: 'ask', title }).unwrap();
    } catch (err) {
      setDraft(content);
      toast.error(errorText(err));
    } finally {
      setPending(null);
    }
  };

  const onClear = async () => {
    if (busy || messages.length === 0) return;
    const confirmed = window.confirm('Clear this conversation and the saved research sources?');
    if (!confirmed) return;
    try {
      await clearResearch(ideaId).unwrap();
      toast.success('Research cleared');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const onGenerate = async () => {
    if (busy) return;
    try {
      const result = await generateArticle(ideaId).unwrap();
      onArticleGenerated?.(result.mediumArticle);
      toast.success('Article saved');
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file || busy) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error('Only PDF files can be added');
      return;
    }
    setPending({ role: 'source', content: file.name });
    try {
      await uploadPdf({ ideaId, file, title }).unwrap();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setPending(null);
    }
  };

  const onText = async () => {
    const content = contextText.trim();
    if (!content || busy) return;
    setPending({ role: 'source', content: content.slice(0, 180) });
    try {
      await uploadText({ ideaId, content, title }).unwrap();
      setContextText('');
      setTextOpen(false);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col min-h-[420px] max-h-[72vh] rounded-xl border border-border/70 bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        <span className="relative grid h-6 w-6 place-items-center">
          <span
            className="absolute inset-0 rounded-full bg-primary/30"
            style={{ animation: 'research-glow 2.8s ease-in-out infinite' }}
          />
          <Sparkles className="relative h-3.5 w-3.5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-none">Research assistant</p>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {isClearing ? 'Clearing research' : isGenerating ? 'Writing the article' : isUploading || isUploadingText ? 'Saving the context' : busy ? 'Looking through your sources' : 'Answers stay with this idea'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-destructive"
          disabled={busy || messages.length === 0}
          onClick={() => void onClear()}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading && <p className="text-sm text-muted-foreground">Opening the thread…</p>}
        {!isLoading && messages.length === 0 && !pending && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add a PDF or a long note, then ask about them. The conversation is saved on this idea.
          </p>
        )}
        {messages.map((message, index) => {
          const isAssistant = message.role === 'assistant';
          const isLatest = index === messages.length - 1;
          return (
            <div
              key={message.id}
              className={cn(
                'w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                isAssistant && 'rounded-tl-md bg-primary/10',
                message.role === 'user' && 'ml-auto rounded-tr-md bg-muted',
                message.role === 'source' && 'border border-dashed border-border/80 text-muted-foreground'
              )}
              style={isLatest ? { animation: 'research-in 0.35s ease-out' } : undefined}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide mb-1 text-muted-foreground">
                {isAssistant ? 'Assistant' : message.role === 'source' ? 'Source' : 'You'}
              </p>
              {isAssistant ? readable(message.content) : message.content}
            </div>
          );
        })}
        {pending && (
          <div className="w-fit max-w-[85%] ml-auto rounded-2xl rounded-tr-md bg-muted px-3 py-2 text-sm whitespace-pre-wrap" style={{ animation: 'research-in 0.25s ease-out' }}>
            <p className="text-[10px] font-medium uppercase tracking-wide mb-1 text-muted-foreground">
              {pending.role === 'source' ? 'Source' : 'You'}
            </p>
            {pending.content}
          </div>
        )}
        {busy && (
          <div className="w-fit inline-flex items-center gap-2 rounded-2xl rounded-tl-md bg-primary/10 px-3 py-2">
            <span className="flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  style={{ animation: `research-dot 1.2s ease-in-out ${dot * 0.15}s infinite` }}
                />
              ))}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isGenerating ? 'Writing the article' : isUploading || isUploadingText || pending?.role === 'source' ? 'Reading the source' : 'Thinking'}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-border/70 p-2.5 space-y-2 focus-within:bg-primary/5 transition-colors"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            void submit();
          }}
          placeholder="Paste research or ask a question about the sources…"
          disabled={busy}
          className="h-[88px] min-h-[88px] max-h-[88px] text-sm resize-none border-transparent bg-muted/30 focus-visible:border-primary/40"
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => {
                void onFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setContextOpen(true)}
            >
              Add context
            </Button>
            <Dialog open={contextOpen} onOpenChange={setContextOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add context</DialogTitle>
                  <DialogDescription>Choose how to add research for this idea.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setContextOpen(false);
                      fileRef.current?.click();
                    }}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Upload PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setContextOpen(false);
                      setTextOpen(true);
                    }}
                  >
                    <Type className="h-3.5 w-3.5" />
                    Upload text
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={textOpen} onOpenChange={setTextOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload text</DialogTitle>
                  <DialogDescription>Paste a long note. It is stored as research context for this idea.</DialogDescription>
                </DialogHeader>
                <Textarea
                  value={contextText}
                  onChange={(event) => setContextText(event.target.value)}
                  placeholder="Paste the text you want to keep…"
                  disabled={busy}
                  className="min-h-64 max-h-[50vh] text-sm"
                />
                <DialogFooter>
                  <Button type="button" disabled={!contextText.trim() || busy} onClick={() => void onText()}>
                    Add text
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasConversation || busy}
              onClick={() => void onGenerate()}
            >
              <FileText className="h-3.5 w-3.5" />
              Generate article
            </Button>
            <Button type="submit" size="sm" disabled={!draft.trim() || busy}>
              <Send className="h-3.5 w-3.5" />
              Ask
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
