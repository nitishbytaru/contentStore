import { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteIdeaVector } from '@/lib/idea-index';
import { clearResearchChunks } from '@/lib/research-index';

export interface ProfileSummary {
  email: string;
  /** Full name from Google; null for email/password accounts. */
  fullName: string | null;
  /** Google profile photo. Only set when the account has a linked Google identity. */
  avatarUrl: string | null;
  /** How the user can sign in, e.g. ['google', 'email']. */
  providers: string[];
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

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Profile fields that come from Google sign-in. The photo is read from the Google identity
 * itself, so email/password accounts never show one (they get an initial instead).
 */
function googleProfile(user: User) {
  const google = user.identities?.find((identity) => identity.provider === 'google');
  const data = (google?.identity_data ?? {}) as Record<string, unknown>;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    fullName: text(data.full_name) ?? text(data.name) ?? (google ? text(meta.full_name) ?? text(meta.name) : null),
    avatarUrl: google ? text(data.avatar_url) ?? text(data.picture) ?? text(meta.avatar_url) ?? text(meta.picture) : null,
  };
}

function signInProviders(user: User): string[] {
  const fromApp = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata.providers as string[]) : [];
  const fromIdentities = (user.identities ?? []).map((identity) => identity.provider);
  return Array.from(new Set([...fromApp, ...fromIdentities, user.app_metadata?.provider].filter(Boolean) as string[]));
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

  const google = googleProfile(user);
  return {
    email: user.email ?? '',
    fullName: google.fullName,
    avatarUrl: google.avatarUrl,
    providers: signInProviders(user),
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
