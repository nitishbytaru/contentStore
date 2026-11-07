import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createUserIdea } from '@/lib/supabase/ideas';
import { deleteIdeaVector, upsertIdeaVector } from '@/lib/idea-index';
import { deleteResearchForIdea } from '@/lib/research-index';
import { SAMPLE_IDEA, SAMPLE_PROMPT, SAMPLE_SCRIPT } from '@/lib/onboarding/sample-content';

/** How long an untouched sample idea / prompt lives before it is removed. */
export const SAMPLE_TTL_MS = 2 * 24 * 60 * 60 * 1000;

function expiresAt() {
  return new Date(Date.now() + SAMPLE_TTL_MS).toISOString();
}

export interface SampleState {
  /** The idea is an onboarding sample (scripted questions / sample prompt are simulated). */
  isSample: boolean;
  /** The user has not really used it yet (it will expire; Generate Article is simulated). */
  unused: boolean;
}

/** Reads the sample flags for an idea. RLS scopes the read to the current user. */
export async function getSampleState(ideaId: string, supabase?: SupabaseClient): Promise<SampleState> {
  try {
    const client = supabase ?? (await createClient());
    const { data } = await client
      .from('ideas')
      .select('is_sample, sample_expires_at')
      .eq('id', ideaId)
      .maybeSingle();
    const isSample = Boolean(data?.is_sample);
    return { isSample, unused: isSample && Boolean(data?.sample_expires_at) };
  } catch {
    return { isSample: false, unused: false };
  }
}

/** The user really used the sample idea, so it is no longer auto-deleted. */
export async function keepSample(ideaId: string, supabase?: SupabaseClient): Promise<void> {
  try {
    const client = supabase ?? (await createClient());
    await client
      .from('ideas')
      .update({ sample_expires_at: null })
      .eq('id', ideaId)
      .eq('is_sample', true)
      .not('sample_expires_at', 'is', null);
  } catch (error) {
    console.warn('Could not mark the sample idea as kept:', error);
  }
}

/**
 * Creates the onboarding sample idea and prompt for a user. Idempotent: an existing
 * sample idea is reused, and the sample prompt is only created when missing.
 */
export async function createSampleForUser(supabase: SupabaseClient, userId: string): Promise<{ ideaId: string }> {
  const { data: existing } = await supabase
    .from('ideas')
    .select('id')
    .eq('user_id', userId)
    .eq('is_sample', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let ideaId = existing?.id as string | undefined;

  if (!ideaId) {
    const idea = await createUserIdea(supabase, userId, {
      idea: SAMPLE_IDEA.title,
      description: SAMPLE_IDEA.description,
      formats: { article: true, video: true },
    });
    ideaId = idea.ideaId;

    const { error } = await supabase
      .from('ideas')
      .update({
        youtube_script: SAMPLE_SCRIPT,
        is_sample: true,
        sample_expires_at: expiresAt(),
      })
      .eq('id', ideaId)
      .eq('user_id', userId);
    if (error) throw error;

    try {
      await upsertIdeaVector({ ideaId, title: idea.idea, notes: idea.baseArticle || '' });
    } catch (indexError) {
      console.warn('Sample idea saved, but the search index was not updated:', indexError);
    }
  }

  const { data: prompt } = await supabase
    .from('prompts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_sample', true)
    .limit(1)
    .maybeSingle();

  if (!prompt) {
    const { error } = await supabase.from('prompts').insert({
      user_id: userId,
      title: SAMPLE_PROMPT.title,
      content: SAMPLE_PROMPT.content,
      is_sample: true,
      sample_expires_at: expiresAt(),
    });
    if (error) console.warn('Sample prompt was not created:', error);
  }

  return { ideaId };
}

/**
 * Deletes a user's sample ideas (with their research and search vectors) and sample prompts.
 * `expiredOnly` limits it to samples whose 2-day window has passed and were never used.
 */
async function deleteSamples(supabase: SupabaseClient, userId: string, expiredOnly: boolean): Promise<void> {
  const now = new Date().toISOString();

  let ideasQuery = supabase.from('ideas').select('id').eq('user_id', userId).eq('is_sample', true);
  if (expiredOnly) ideasQuery = ideasQuery.lt('sample_expires_at', now);
  const { data: ideas, error } = await ideasQuery;
  if (error) throw error;

  for (const row of ideas ?? []) {
    // Research messages go first (they need the idea row for RLS), then the idea.
    await deleteResearchForIdea(row.id);
    await supabase.from('ideas').delete().eq('id', row.id).eq('user_id', userId);
    await deleteIdeaVector(row.id).catch((err) =>
      console.warn(`Failed to delete sample idea vector for ${row.id}:`, err)
    );
  }

  let promptsQuery = supabase.from('prompts').delete().eq('user_id', userId).eq('is_sample', true);
  if (expiredOnly) promptsQuery = promptsQuery.lt('sample_expires_at', now);
  await promptsQuery;
}

/** Removes sample ideas and prompts the user never used once they expire. */
export async function cleanupExpiredSamples(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    await deleteSamples(supabase, userId, true);
  } catch (error) {
    console.warn('Expired sample cleanup failed:', error);
  }
}

/** Removes all of a user's sample data right away (used when they skip the tour). */
export async function deleteAllSamples(supabase: SupabaseClient, userId: string): Promise<void> {
  await deleteSamples(supabase, userId, false);
}
