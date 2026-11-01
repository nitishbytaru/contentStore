import { createClient } from '@/lib/supabase/server';

export interface ResearchMessage {
  id: string;
  ideaId: string;
  role: 'user' | 'assistant' | 'source';
  content: string;
  createdAt: string;
}

export async function listResearchMessages(ideaId: string): Promise<ResearchMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('research_messages')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    ideaId: row.idea_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function appendResearchMessage(
  ideaId: string,
  role: ResearchMessage['role'],
  content: string
): Promise<ResearchMessage> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be logged in to save research messages');
  }

  const { data, error } = await supabase
    .from('research_messages')
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      role,
      content: content.slice(0, 45000),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    ideaId: data.idea_id,
    role: data.role,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function clearResearchMessages(ideaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('research_messages')
    .delete()
    .eq('idea_id', ideaId);

  if (error) throw error;
}
