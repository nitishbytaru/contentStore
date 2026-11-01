'use client';

import { useEffect, useRef, useState } from 'react';
import { FileUp, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetResearchMessagesQuery,
  useSendResearchMutation,
  useUploadResearchPdfMutation,
} from '@/store/api/ideasApi';
import { cn } from 'cn';

export function ResearchChat({ ideaId, title }: { ideaId: string; title: string }) {
  const { data: messages = [], isLoading } = useGetResearchMessagesQuery(ideaId);
  const [sendResearch, { isLoading: isSending }] = useSendResearchMutation();
  const [uploadPdf, { isLoading: isUploading }] = useUploadResearchPdfMutation();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const busy = isSending || isUploading;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  const errorText = (err: unknown) => {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data?: { error?: string } }).data;
      if (data?.error) return data.error;
    }
    return 'Research could not be saved';
  };

  const submit = async (mode: 'ask' | 'source') => {
    const content = draft.trim();
    if (!content || busy) return;
    try {
      await sendResearch({ ideaId, content, mode, title }).unwrap();
      setDraft('');
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
    try {
      await uploadPdf({ ideaId, file, title }).unwrap();
      toast.success(`${file.name} added to this research`);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="flex flex-col min-h-[420px] max-h-[72vh] rounded-xl border border-border/70 bg-background">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading research…</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste notes or upload a PDF. Then ask a question. This thread stays with the idea, and later visits continue from the same sources.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
              message.role === 'assistant' && 'bg-primary/10 text-foreground',
              message.role === 'user' && 'ml-auto bg-muted text-foreground',
              message.role === 'source' && 'border border-dashed border-border text-muted-foreground'
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">
              {message.role === 'assistant' ? 'Research' : message.role === 'source' ? 'Source' : 'You'}
            </p>
            {message.content}
          </div>
        ))}
        {busy && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the sources…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-border/70 p-2.5 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit('ask');
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Paste research or ask a question about the sources…"
          disabled={busy}
          className="min-h-[88px] text-sm resize-y"
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
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload PDF
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!draft.trim() || busy}
              onClick={() => void submit('source')}
            >
              Save source
            </Button>
            <Button type="submit" size="sm" disabled={!draft.trim() || busy}>
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Ask
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
