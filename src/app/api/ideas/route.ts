import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { ideaIndexText } from '@/lib/idea-embeddings';
import { deleteIdeaVector, replaceIdeaVector, upsertIdeaVector } from '@/lib/idea-index';
import { deleteResearchForIdea } from '@/lib/research-index';
import { matchesIdeaFilters } from '@/utils/ideaStatus';
import { Idea, IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { IdeaStatus } from '@/enums';
import { createClient } from '@/lib/supabase/server';
import {
  fetchUserIdeas,
  fetchUserIdeaById,
  createUserIdea,
  updateUserIdea,
  deleteUserIdea,
} from '@/lib/supabase/ideas';

export const dynamic = 'force-dynamic';

const HEADERS = [
  'ideaId', 'idea', 'description', 'status', 'datePosted', 'createdAt',
  'baseArticle', 'mediumArticle', 'youtubeScript',
  'eligibleMedium', 'eligibleSubstack', 'eligibleYoutube', 'eligibleInstagram',
  'ineligibleMedium', 'ineligibleSubstack', 'ineligibleYoutube', 'ineligibleInstagram',
];

const BOOLEAN_FIELDS = [
  'eligibleMedium', 'eligibleSubstack', 'eligibleYoutube', 'eligibleInstagram',
  'ineligibleMedium', 'ineligibleSubstack', 'ineligibleYoutube', 'ineligibleInstagram',
];

const BOOLEAN_SET = new Set(BOOLEAN_FIELDS);

function indexedNotes(baseArticle: unknown, description: unknown): string {
  return [baseArticle, description]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('\n');
}

let isIdeasSheetInitialized = false;

async function getIdeasSheet() {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];

  if (!isIdeasSheetInitialized) {
    const targetCols = Math.max(HEADERS.length + 10, 45);
    if ((sheet.columnCount || 0) < targetCols) {
      try {
        await sheet.resize({
          rowCount: Math.max(sheet.rowCount || 100, 100),
          columnCount: targetCols,
        });
      } catch (resizeErr) {
        console.warn('Failed pre-resizing sheet columns:', resizeErr);
      }
    }

    try {
      await sheet.loadHeaderRow();
      const currentHeaders = [...sheet.headerValues];
      const missingHeaders = HEADERS.filter(h => !currentHeaders.includes(h));

      if (missingHeaders.length > 0) {
        await sheet.setHeaderRow([...currentHeaders, ...missingHeaders]);
      }
    } catch {
      await sheet.setHeaderRow(HEADERS);
    }
    isIdeasSheetInitialized = true;
  }

  return sheet;
}

function parseRowToIdea(row: any): Idea {
  const data: Record<string, any> = {};
  for (const header of HEADERS) {
    const rawVal = row.get(header);
    if (BOOLEAN_SET.has(header)) {
      data[header] = rawVal === true || rawVal === 'true';
    } else {
      data[header] = rawVal || '';
    }
  }
  data.ideaId = String(row.get('ideaId') || row.get('id') || '');
  return data as Idea;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');
    const typeParam = searchParams.get('type') as IdeaTypeFilter | null;
    const statusParam = searchParams.get('status') as IdeaStatusFilter | null;

    // 1. Check if Supabase authenticated user exists
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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
      }
    }

    // 2. Fallback to Google Sheets
    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();

    if (ideaId) {
      const targetRow = rows.find(r => (r.get('ideaId') || r.get('id')) === ideaId);
      if (!targetRow) {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
      }
      return NextResponse.json({ data: parseRowToIdea(targetRow) }, { status: 200 });
    }

    const data = rows.map(parseRowToIdea);
    let filteredData = data;
    if (typeParam || statusParam) {
      filteredData = data.filter(item =>
        matchesIdeaFilters(item, typeParam || 'all', statusParam || 'pending')
      );
    }

    return NextResponse.json({ data: filteredData }, { status: 200 });
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

    // 1. Supabase insert
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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
      }
    }

    // 2. Google Sheets insert fallback
    const sheet = await getIdeasSheet();
    const descText = description ? String(description).trim() : '';
    const generatedIdeaId = crypto.randomUUID();

    const newIdea: Record<string, any> = {
      ideaId: generatedIdeaId,
      idea: idea.trim(),
      description: descText,
      status: 'pending',
      datePosted: '',
      createdAt: new Date().toISOString(),
      baseArticle: baseArticle || descText,
      mediumArticle: '',
      youtubeScript: '',
    };

    for (const field of BOOLEAN_FIELDS) {
      newIdea[field] = false;
    }

    newIdea.eligibleMedium = true;
    newIdea.eligibleSubstack = true;
    newIdea.eligibleYoutube = true;
    newIdea.eligibleInstagram = true;

    await sheet.addRow(newIdea);

    try {
      await upsertIdeaVector({
        ideaId: generatedIdeaId,
        title: newIdea.idea,
        notes: indexedNotes(newIdea.baseArticle, newIdea.description),
      });
    } catch (indexError) {
      console.warn('Idea saved to Sheet, but the search index was not updated:', indexError);
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

    // 1. Supabase update
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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
      }
    }

    // 2. Google Sheets update fallback
    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => (r.get('ideaId') || r.get('id')) === ideaId);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const previousIndexText = ideaIndexText(
      String(targetRow.get('idea') || ''),
      indexedNotes(targetRow.get('baseArticle'), targetRow.get('description'))
    );

    for (const header of HEADERS) {
      if (payload[header] !== undefined) {
        if (typeof payload[header] === 'boolean') {
          targetRow.set(header, payload[header] ? 'true' : 'false');
        } else {
          targetRow.set(header, payload[header]);
        }
      }
    }

    targetRow.set('ideaId', ideaId);

    if (payload.status === IdeaStatus.POSTED) {
      targetRow.set('datePosted', new Date().toISOString());
    } else if (payload.status === IdeaStatus.PENDING) {
      targetRow.set('datePosted', '');
    }

    await targetRow.save();

    const saved = parseRowToIdea(targetRow);
    const nextIndexText = ideaIndexText(saved.idea, indexedNotes(saved.baseArticle, saved.description));
    if (previousIndexText !== nextIndexText) {
      try {
        await replaceIdeaVector({
          ideaId,
          title: saved.idea,
          notes: indexedNotes(saved.baseArticle, saved.description),
        });
      } catch (indexError) {
        console.warn('Idea updated, but the search index was not updated:', indexError);
      }
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

    // 1. Supabase delete
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
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
      }
    }

    // 2. Google Sheets delete fallback
    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => (r.get('ideaId') || r.get('id')) === ideaId);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await targetRow.delete();

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
