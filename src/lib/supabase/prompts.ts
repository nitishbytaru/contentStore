import { PromptItem } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchUserPrompts(supabase: SupabaseClient): Promise<PromptItem[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSample: Boolean(row.is_sample),
  }));
}

export async function createUserPrompt(
  supabase: SupabaseClient,
  userId: string,
  params: { title: string; content: string }
): Promise<PromptItem> {
  const newRow = {
    user_id: userId,
    title: params.title.trim(),
    content: params.content.trim(),
  };

  const { data, error } = await supabase
    .from('prompts')
    .insert(newRow)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateUserPrompt(
  supabase: SupabaseClient,
  promptId: string,
  updates: { title?: string; content?: string }
): Promise<PromptItem> {
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
  if (updates.content !== undefined) dbUpdates.content = updates.content.trim();
  // Editing an onboarding sample prompt means the user keeps it (no-op for normal prompts).
  dbUpdates.sample_expires_at = null;

  const { data, error } = await supabase
    .from('prompts')
    .update(dbUpdates)
    .eq('id', promptId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteUserPrompt(
  supabase: SupabaseClient,
  promptId: string
): Promise<void> {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId);

  if (error) throw error;
}
