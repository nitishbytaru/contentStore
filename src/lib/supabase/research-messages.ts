import { SupabaseClient } from '@supabase/supabase-js';

export interface ResearchMessage {
  id: string;
  ideaId: string;
  userId: string;
  role: 'user' | 'assistant' | 'source';
  content: string;
  createdAt: string;
}

export async function listUserResearchMessages(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string
): Promise<ResearchMessage[]> {
  const { data, error } = await supabase
    .from('research_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function appendUserResearchMessage(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string,
  role: 'user' | 'assistant' | 'source',
  content: string
): Promise<ResearchMessage> {
  const { data, error } = await supabase
    .from('research_messages')
    .insert({
      user_id: userId,
      idea_id: ideaId,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    ideaId: data.idea_id,
    userId: data.user_id,
    role: data.role,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function clearUserResearchMessages(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string
): Promise<void> {
  const { error } = await supabase
    .from('research_messages')
    .delete()
    .eq('user_id', userId)
    .eq('idea_id', ideaId);

  if (error) throw error;
}
