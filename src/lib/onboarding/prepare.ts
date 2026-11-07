import { SupabaseClient } from '@supabase/supabase-js';
import { saveResearchSource } from '@/lib/research-chat';
import { appendResearchMessage, listResearchMessages } from '@/lib/research-messages';
import { AlreadyAddedError, sourceKeyForText } from '@/lib/research-index';
import { SAMPLE_ARTICLE, SAMPLE_CONTEXT, SAMPLE_QA } from '@/lib/onboarding/sample-content';
import type { TourNeed } from '@/lib/onboarding/tour-steps';

/**
 * When the user skips part of the tour, fills in what that part would have created on the
 * sample idea, so the next section still works:
 * - 'context': the sample notes are added (and indexed) as research.
 * - 'article': context plus a short Q&A conversation and the article draft.
 * Idempotent: anything already present is left alone. Returns the sample idea id and
 * whether anything was created (so the client only refreshes when needed).
 */
export async function prepareSample(
  supabase: SupabaseClient,
  userId: string,
  need: TourNeed
): Promise<{ ideaId: string; changed: boolean } | null> {
  const { data: idea } = await supabase
    .from('ideas')
    .select('id, idea, medium_article')
    .eq('user_id', userId)
    .eq('is_sample', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!idea) return null;

  const messages = await listResearchMessages(idea.id);
  let changed = false;

  if (!messages.some((message) => message.role === 'source')) {
    try {
      await saveResearchSource(idea.id, 'Pasted text', SAMPLE_CONTEXT, idea.idea, {
        sourceKey: sourceKeyForText(SAMPLE_CONTEXT),
        maxChunks: 160,
      });
      changed = true;
    } catch (error) {
      if (!(error instanceof AlreadyAddedError)) throw error;
    }
  }

  if (need === 'article') {
    if (!messages.some((message) => message.role === 'user')) {
      for (const qa of SAMPLE_QA.slice(0, 2)) {
        await appendResearchMessage(idea.id, 'user', qa.question);
        await appendResearchMessage(idea.id, 'assistant', qa.answer);
      }
      changed = true;
    }
    if (!String(idea.medium_article || '').trim()) {
      const { error } = await supabase
        .from('ideas')
        .update({ medium_article: SAMPLE_ARTICLE, updated_at: new Date().toISOString() })
        .eq('id', idea.id)
        .eq('user_id', userId);
      if (error) throw error;
      changed = true;
    }
  }

  return { ideaId: idea.id, changed };
}
