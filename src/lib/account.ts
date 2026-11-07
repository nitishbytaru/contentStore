import { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteIdeaVector } from '@/lib/idea-index';
import { clearResearchChunks } from '@/lib/research-index';

export interface ProfileSummary {
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  stats: {
    ideas: number;
    completedIdeas: number;
    prompts: number;
    researchMessages: number;
  };
  telegramLinked: boolean;
}

async function countRows(query: PromiseLike<{ count: number | null }>): Promise<number> {
  const { count } = await query;
  return count ?? 0;
}

/** Account details and usage counts for the profile page. Sample (tour) data is not counted. */
export async function getProfileSummary(supabase: SupabaseClient, user: User): Promise<ProfileSummary> {
  const head = { count: 'exact' as const, head: true };
  const [ideas, completedIdeas, prompts, researchMessages, telegram] = await Promise.all([
    countRows(supabase.from('ideas').select('id', head).eq('user_id', user.id).eq('is_sample', false)),
    countRows(
      supabase.from('ideas').select('id', head).eq('user_id', user.id).eq('is_sample', false).eq('status', 'posted')
    ),
    countRows(supabase.from('prompts').select('id', head).eq('user_id', user.id).eq('is_sample', false)),
    countRows(supabase.from('research_messages').select('id', head).eq('user_id', user.id)),
    supabase.from('telegram_links').select('linked_at').eq('user_id', user.id).maybeSingle(),
  ]);

  return {
    email: user.email ?? '',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    stats: { ideas, completedIdeas, prompts, researchMessages },
    telegramLinked: Boolean(telegram.data?.linked_at),
  };
}

export class AccountDeletionError extends Error {}

/**
 * Permanently deletes a user and everything they own:
 * 1. search vectors in Qdrant (idea vectors + research chunks), which the database cannot cascade to;
 * 2. their rows (research messages, ideas, prompts, Telegram link);
 * 3. the Supabase auth user itself.
 *
 * Vectors are removed first: if that fails, nothing else is touched, so the user can retry
 * without being left with an account that has lost only part of its data.
 */
export async function deleteUserAccount(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: ideas, error: listError } = await supabase.from('ideas').select('id').eq('user_id', userId);
  if (listError) throw new AccountDeletionError('Could not read your ideas. Nothing was deleted.');
  const ideaIds = (ideas ?? []).map((row) => row.id as string);

  try {
    for (let index = 0; index < ideaIds.length; index += 10) {
      const batch = ideaIds.slice(index, index + 10);
      await Promise.all(batch.flatMap((id) => [deleteIdeaVector(id), clearResearchChunks(id)]));
    }
  } catch (error) {
    console.error('Account deletion: vector cleanup failed', error);
    throw new AccountDeletionError('Could not remove your search data. Nothing was deleted, please try again.');
  }

  // Service role: bypasses RLS, so every query is filtered by the server-resolved user id.
  const admin = createAdminClient();
  for (const table of ['research_messages', 'ideas', 'prompts', 'telegram_links']) {
    const { error } = await admin.from(table).delete().eq('user_id', userId);
    if (error) {
      console.error(`Account deletion: failed to delete ${table}`, error);
      throw new AccountDeletionError('Some of your data could not be deleted. Please try again.');
    }
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('Account deletion: failed to delete auth user', authError);
    throw new AccountDeletionError('Your data was deleted, but the account could not be removed. Please try again.');
  }
}
