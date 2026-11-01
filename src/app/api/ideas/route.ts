import { NextResponse } from 'next/server';
import { ideaIndexText } from '@/lib/idea-embeddings';
import { deleteIdeaVector, replaceIdeaVector, upsertIdeaVector } from '@/lib/idea-index';
import { deleteResearchForIdea } from '@/lib/research-index';
import { matchesIdeaFilters } from '@/utils/ideaStatus';
import { IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { createClient } from '@/lib/supabase/server';
import {
  fetchUserIdeas,
  fetchUserIdeaById,
  createUserIdea,
  updateUserIdea,
  deleteUserIdea,
} from '@/lib/supabase/ideas';

export const dynamic = 'force-dynamic';

function indexedNotes(baseArticle: unknown, description: unknown): string {
  return [baseArticle, description]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');
    const typeParam = searchParams.get('type') as IdeaTypeFilter | null;
    const statusParam = searchParams.get('status') as IdeaStatusFilter | null;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (ideaId) {
      const idea = await fetchUserIdeaById(supabase, user.id, ideaId);
      if (!idea) {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
      }
      return NextResponse.json({ data: idea }, { status: 200 });
    }

    const ideas = await fetchUserIdeas(supabase, user.id, typeParam || undefined, statusParam || undefined);
    let filtered = ideas;
    if (typeParam || statusParam) {
      filtered = ideas.filter(item =>
        matchesIdeaFilters(item, typeParam || 'all', statusParam || 'pending')
      );
    }

    return NextResponse.json({ data: filtered }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { idea, description, baseArticle } = await request.json();

    if (!idea || !idea.trim()) {
      return NextResponse.json({ error: 'Title / Idea is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const newIdea = await createUserIdea(supabase, user.id, {
      idea,
      description,
      baseArticle,
    });

    try {
      await upsertIdeaVector({
        ideaId: newIdea.ideaId,
        title: newIdea.idea,
        notes: indexedNotes(newIdea.baseArticle, newIdea.description),
      });
    } catch (indexError) {
      console.warn('Idea saved to Supabase, but the search index was not updated:', indexError);
    }

    return NextResponse.json({ data: newIdea }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const { ideaId } = payload;

    if (!ideaId) {
      return NextResponse.json({ error: 'ideaId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const saved = await updateUserIdea(supabase, user.id, ideaId, payload);

    try {
      await replaceIdeaVector({
        ideaId,
        title: saved.idea,
        notes: indexedNotes(saved.baseArticle, saved.description),
      });
    } catch (indexError) {
      console.warn('Idea updated in Supabase, but the search index was not updated:', indexError);
    }

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json({ error: 'ideaId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await deleteUserIdea(supabase, user.id, ideaId);

    // Concurrently purge vectors & research chunks from Qdrant
    await Promise.allSettled([
      deleteIdeaVector(ideaId).catch((err) =>
        console.warn(`Failed to delete idea vector for ${ideaId}:`, err)
      ),
      deleteResearchForIdea(ideaId).catch((err) =>
        console.warn(`Failed to delete research data for ${ideaId}:`, err)
      ),
    ]);

    return NextResponse.json({ success: true, message: 'Idea and all associated data deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
