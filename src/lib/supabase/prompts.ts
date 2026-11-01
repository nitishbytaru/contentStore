import { PromptItem } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: 'default-1',
    title: 'Engaging Tech Article',
    content: 'Write an engaging, high-retention technical article based on the draft. Use a hook in the intro, clear sections, real-world practical examples, and an actionable takeaway.',
    category: 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    title: 'X / Twitter Viral Thread',
    content: 'Convert the main insights of this draft into a compelling 6-8 tweet thread. First tweet must have a strong curiosity gap. Use bullet points and clean whitespace.',
    category: 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-3',
    title: 'Concise Summary & Takeaways',
    content: 'Summarize the core concepts of this article into 3 clear bullet points and a 1-paragraph TL;DR summary for fast reading.',
    category: 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function fetchUserPrompts(supabase: SupabaseClient): Promise<PromptItem[]> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_PROMPTS;
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category || 'General',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return DEFAULT_PROMPTS;
  }
}

export async function createUserPrompt(
  supabase: SupabaseClient,
  userId: string,
  params: { title: string; content: string; category?: string }
): Promise<PromptItem> {
  const newRow = {
    user_id: userId,
    title: params.title.trim(),
    content: params.content.trim(),
    category: params.category || 'General',
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
    category: data.category,
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
    category: data.category,
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
