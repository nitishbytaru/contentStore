import { Idea, IdeaStatusFilter, IdeaTypeFilter } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface DbIdeaRow {
  id: string;
  user_id: string;
  idea: string;
  description: string;
  status: 'pending' | 'posted';
  date_posted: string | null;
  created_at: string;
  updated_at: string;
  base_article: string;
  medium_article: string;
  youtube_script: string;
  eligible_medium: boolean;
  eligible_substack: boolean;
  ineligible_medium: boolean;
  ineligible_substack: boolean;
  eligible_youtube: boolean;
  eligible_instagram: boolean;
  ineligible_youtube: boolean;
  ineligible_instagram: boolean;
}

export function mapDbRowToIdea(row: DbIdeaRow): Idea {
  return {
    ideaId: row.id,
    idea: row.idea,
    description: row.description || '',
    status: row.status as any,
    datePosted: row.date_posted || '',
    createdAt: row.created_at,
    baseArticle: row.base_article || '',
    mediumArticle: row.medium_article || '',
    youtubeScript: row.youtube_script || '',
    eligibleMedium: row.eligible_medium,
    eligibleSubstack: row.eligible_substack,
    ineligibleMedium: row.ineligible_medium,
    ineligibleSubstack: row.ineligible_substack,
    eligibleYoutube: row.eligible_youtube,
    eligibleInstagram: row.eligible_instagram,
    ineligibleYoutube: row.ineligible_youtube,
    ineligibleInstagram: row.ineligible_instagram,
  };
}

export async function fetchUserIdeas(supabase: SupabaseClient, userId: string, type?: IdeaTypeFilter, status?: IdeaStatusFilter): Promise<Idea[]> {
  let query = supabase
    .from('ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    const dbStatus = status === 'completed' ? 'posted' : 'pending';
    query = query.eq('status', dbStatus);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapDbRowToIdea);
}

export async function fetchUserIdeaById(supabase: SupabaseClient, userId: string, ideaId: string): Promise<Idea | null> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return data ? mapDbRowToIdea(data) : null;
}

export async function createUserIdea(
  supabase: SupabaseClient,
  userId: string,
  params: {
    idea: string;
    description?: string;
    baseArticle?: string;
    /** Content formats to enable. Defaults to both article and video. */
    formats?: { article: boolean; video: boolean };
    /** Create the idea already marked as completed (posted). */
    completed?: boolean;
  }
): Promise<Idea> {
  const article = params.formats?.article ?? true;
  const video = params.formats?.video ?? true;
  const newRow = {
    user_id: userId,
    idea: params.idea.trim(),
    description: (params.description || '').trim(),
    status: params.completed ? 'posted' : 'pending',
    date_posted: params.completed ? new Date().toISOString() : null,
    base_article: params.baseArticle || params.description || '',
    medium_article: '',
    youtube_script: '',
    eligible_medium: article,
    eligible_substack: article,
    ineligible_medium: !article,
    ineligible_substack: !article,
    eligible_youtube: video,
    eligible_instagram: video,
    ineligible_youtube: !video,
    ineligible_instagram: !video,
  };

  const { data, error } = await supabase
    .from('ideas')
    .insert(newRow)
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToIdea(data);
}

export async function updateUserIdea(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string,
  updates: Partial<Idea>
): Promise<Idea> {
  const dbUpdates: Partial<DbIdeaRow> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.idea !== undefined) dbUpdates.idea = updates.idea.trim();
  if (updates.description !== undefined) dbUpdates.description = updates.description.trim();
  if (updates.status !== undefined) dbUpdates.status = updates.status as any;
  if (updates.datePosted !== undefined) dbUpdates.date_posted = updates.datePosted || null;
  if (updates.baseArticle !== undefined) dbUpdates.base_article = updates.baseArticle;
  if (updates.mediumArticle !== undefined) dbUpdates.medium_article = updates.mediumArticle;
  if (updates.youtubeScript !== undefined) dbUpdates.youtube_script = updates.youtubeScript;

  if (updates.eligibleMedium !== undefined) dbUpdates.eligible_medium = updates.eligibleMedium;
  if (updates.eligibleSubstack !== undefined) dbUpdates.eligible_substack = updates.eligibleSubstack;
  if (updates.ineligibleMedium !== undefined) dbUpdates.ineligible_medium = updates.ineligibleMedium;
  if (updates.ineligibleSubstack !== undefined) dbUpdates.ineligible_substack = updates.ineligibleSubstack;
  if (updates.eligibleYoutube !== undefined) dbUpdates.eligible_youtube = updates.eligibleYoutube;
  if (updates.eligibleInstagram !== undefined) dbUpdates.eligible_instagram = updates.eligibleInstagram;
  if (updates.ineligibleYoutube !== undefined) dbUpdates.ineligible_youtube = updates.ineligibleYoutube;
  if (updates.ineligibleInstagram !== undefined) dbUpdates.ineligible_instagram = updates.ineligibleInstagram;

  const { data, error } = await supabase
    .from('ideas')
    .update(dbUpdates)
    .eq('id', ideaId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToIdea(data);
}

export async function deleteUserIdea(
  supabase: SupabaseClient,
  userId: string,
  ideaId: string
): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', userId);

  if (error) throw error;
}
