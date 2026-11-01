import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { matchesIdeaFilters } from '@/utils/ideaStatus';
import { Idea, IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { IdeaStatus } from '@/enums';

export const dynamic = 'force-dynamic';

const HEADERS = [
  'ideaId', 'idea', 'description', 'status', 'datePosted', 'createdAt',
  'baseArticle', 'mediumArticle', 'youtubeScript',
  'eligibleMedium', 'eligibleSubstack', 'eligibleYoutube', 'eligibleInstagram',
  'ineligibleMedium', 'ineligibleSubstack', 'ineligibleYoutube', 'ineligibleInstagram',
  'publishedMedium', 'publishedSubstack', 'publishedYoutube', 'publishedInstagram',
  'articleDraftedDone', 'articleDraftedAt', 'articlePublishedDone', 'articlePublishedAt',
  'videoShootingDone', 'videoShootingAt', 'videoEditingDone', 'videoEditingAt', 'videoUploadedDone', 'videoUploadedAt'
];

const BOOLEAN_FIELDS = [
  'eligibleMedium', 'eligibleSubstack', 'eligibleYoutube', 'eligibleInstagram',
  'ineligibleMedium', 'ineligibleSubstack', 'ineligibleYoutube', 'ineligibleInstagram',
  'publishedMedium', 'publishedSubstack', 'publishedYoutube', 'publishedInstagram',
  'articleDraftedDone', 'articlePublishedDone',
  'videoShootingDone', 'videoEditingDone', 'videoUploadedDone'
];

const BOOLEAN_SET = new Set(BOOLEAN_FIELDS);

let isIdeasSheetInitialized = false;

/**
 * Retrieves the Google Sheet for ideas and ensures headers and column capacity exist.
 * Uses in-memory caching so expensive resize/header operations only execute once.
 */
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
        const updatedHeaders = [...currentHeaders, ...missingHeaders];
        if (updatedHeaders.length > (sheet.columnCount || 0)) {
          await sheet.resize({
            rowCount: Math.max(sheet.rowCount || 100, 100),
            columnCount: updatedHeaders.length + 10,
          });
        }
        await sheet.setHeaderRow(updatedHeaders);
      }
    } catch {
      await sheet.setHeaderRow(HEADERS);
    }

    isIdeasSheetInitialized = true;
  }

  return sheet;
}

/**
 * Transforms a raw Google Spreadsheet row into a typed Idea object with parsed booleans
 * and ideaId identifier.
 */
function parseRowToIdea(row: any): Idea {
  const data: Record<string, any> = {};
  for (const header of HEADERS) {
    const val = row.get(header) ?? '';
    data[header] = BOOLEAN_SET.has(header) ? String(val).toLowerCase() === 'true' : val;
  }
  data.ideaId = String(row.get('ideaId') || row.get('id') || '');
  return data as Idea;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');

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

    const typeParam = searchParams.get('type') as IdeaTypeFilter | null;
    const statusParam = searchParams.get('status') as IdeaStatusFilter | null;

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
      articleDraftedAt: '',
      articlePublishedAt: '',
      videoShootingAt: '',
      videoEditingAt: '',
      videoUploadedAt: '',
    };

    // Populate all boolean fields with default false
    for (const field of BOOLEAN_FIELDS) {
      newIdea[field] = false;
    }

    // Default Article and Video formats to enabled
    newIdea.eligibleMedium = true;
    newIdea.eligibleSubstack = true;
    newIdea.eligibleYoutube = true;
    newIdea.eligibleInstagram = true;

    await sheet.addRow(newIdea);

    return NextResponse.json({ data: newIdea as Idea }, { status: 201 });
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

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => (r.get('ideaId') || r.get('id')) === ideaId);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    for (const header of HEADERS) {
      if (payload[header] !== undefined) {
        if (typeof payload[header] === 'boolean') {
          targetRow.set(header, payload[header] ? 'true' : 'false');
        } else {
          targetRow.set(header, payload[header]);
        }
      }
    }

    // Set ideaId in target row
    targetRow.set('ideaId', ideaId);

    // Handle posted status logic explicitly if passed
    if (payload.status === IdeaStatus.POSTED) {
      targetRow.set('datePosted', new Date().toISOString());
    } else if (payload.status === IdeaStatus.PENDING) {
      targetRow.set('datePosted', '');
    }

    await targetRow.save();

    return NextResponse.json({ data: parseRowToIdea(targetRow) }, { status: 200 });
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

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => (r.get('ideaId') || r.get('id')) === ideaId);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await targetRow.delete();

    return NextResponse.json({ success: true, message: 'Idea deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
