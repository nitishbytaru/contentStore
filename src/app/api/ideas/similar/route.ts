import { NextResponse } from 'next/server';
import { listIdeaCatalog } from '@/lib/idea-catalog';
import { backfillIdeaIndex, searchSimilarIdeas } from '@/lib/idea-index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const query = typeof text === 'string' ? text.trim() : '';

    if (!query) {
      return NextResponse.json({ error: 'Article text is required' }, { status: 400 });
    }

    const catalog = await listIdeaCatalog();
    if (catalog.length === 0) {
      return NextResponse.json({ data: [], firstIdea: true }, { status: 200 });
    }

    await backfillIdeaIndex(catalog);
    // The catalog comes from Supabase under RLS, so it holds only the signed-in user's ideas.
    const matches = await searchSimilarIdeas(query, catalog.map((entry) => entry.ideaId), 3);

    return NextResponse.json({ data: matches, firstIdea: false }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to scan ideas';
    console.error('Error scanning similar ideas:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
