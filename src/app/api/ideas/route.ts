import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { matchesIdeaFilters } from '@/utils/ideaStatus';
import { IdeaTypeFilter, IdeaStatusFilter } from '@/types';
import { IdeaStatus } from '@/enums';

export const dynamic = 'force-dynamic';

const HEADERS = [
  'id', 'idea', 'description', 'status', 'datePosted', 'createdAt',
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

// Helper to get the correct sheet and ensure headers exist
async function getIdeasSheet() {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];

  // Ensure sheet has enough columns for all headers (Google Sheets defaults to 26 columns A-Z, but we have 31)
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
    
    // Check if all headers exist, if not, append them
    let currentHeaders = [...sheet.headerValues];
    let headersModified = false;
    for (const header of HEADERS) {
      if (!currentHeaders.includes(header)) {
        currentHeaders.push(header);
        headersModified = true;
      }
    }
    if (headersModified) {
      if (currentHeaders.length > (sheet.columnCount || 0)) {
        await sheet.resize({
          rowCount: Math.max(sheet.rowCount || 100, 100),
          columnCount: currentHeaders.length + 10,
        });
      }
      await sheet.setHeaderRow(currentHeaders);
    }
  } catch (e) {
    if (HEADERS.length > (sheet.columnCount || 0)) {
      await sheet.resize({
        rowCount: Math.max(sheet.rowCount || 100, 100),
        columnCount: Math.max(HEADERS.length + 10, 45),
      });
    }
    // If headers don't exist, set them
    await sheet.setHeaderRow(HEADERS);
  }
  return sheet;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    
    if (id) {
      const targetRow = rows.find(r => r.get('id') === id);
      if (!targetRow) {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
      }
      const data = HEADERS.reduce((acc, header) => {
        let val = targetRow.get(header);
        acc[header] = val ?? '';
        return acc;
      }, {} as any);
      // parse booleans
      BOOLEAN_FIELDS.forEach(key => {
        data[key] = String(data[key]).toLowerCase() === 'true';
      });
      return NextResponse.json({ data }, { status: 200 });
    }

    const data = rows.map((row) => {
      const rowData = HEADERS.reduce((acc, header) => {
        let val = row.get(header);
        acc[header] = val ?? '';
        return acc;
      }, {} as any);
      // parse booleans
      BOOLEAN_FIELDS.forEach(key => {
        rowData[key] = String(rowData[key]).toLowerCase() === 'true';
      });
      return rowData;
    });

    const typeParam = searchParams.get('type') as IdeaTypeFilter | null;
    const statusParam = searchParams.get('status') as IdeaStatusFilter | null;

    let filteredData = data;
    if (typeParam || statusParam) {
      filteredData = data.filter(item => 
        matchesIdeaFilters(
          item, 
          typeParam || 'all', 
          statusParam || 'pending'
        )
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
    const newIdea = {
      id: crypto.randomUUID(),
      idea: idea.trim(),
      description: descText,
      status: 'pending',
      datePosted: '',
      createdAt: new Date().toISOString(),
      baseArticle: baseArticle || descText,
      mediumArticle: '',
      youtubeScript: '',
      eligibleMedium: false,
      eligibleSubstack: false,
      eligibleYoutube: false,
      eligibleInstagram: false,
      ineligibleMedium: false,
      ineligibleSubstack: false,
      ineligibleYoutube: false,
      ineligibleInstagram: false,
      publishedMedium: false,
      publishedSubstack: false,
      publishedYoutube: false,
      publishedInstagram: false,
      articleDraftedDone: false,
      articleDraftedAt: '',
      articlePublishedDone: false,
      articlePublishedAt: '',
      videoShootingDone: false,
      videoShootingAt: '',
      videoEditingDone: false,
      videoEditingAt: '',
      videoUploadedDone: false,
      videoUploadedAt: ''
    };

    await sheet.addRow(newIdea);

    return NextResponse.json({ data: newIdea }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const { id } = payload;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    HEADERS.forEach(header => {
      if (payload[header] !== undefined) {
        if (typeof payload[header] === 'boolean') {
          targetRow.set(header, payload[header] ? 'true' : 'false');
        } else {
          targetRow.set(header, payload[header]);
        }
      }
    });

    // Handle posted status logic explicitly if passed, or just update the date if status changed
    if (payload.status === IdeaStatus.POSTED) {
      targetRow.set('datePosted', new Date().toISOString());
    } else if (payload.status === IdeaStatus.PENDING) {
      targetRow.set('datePosted', '');
    }

    await targetRow.save();

    const updatedData = HEADERS.reduce((acc, header) => {
      let val = payload[header] !== undefined ? payload[header] : targetRow.get(header);
      acc[header] = val ?? '';
      return acc;
    }, {} as any);
    
    BOOLEAN_FIELDS.forEach(key => {
      updatedData[key] = String(updatedData[key]).toLowerCase() === 'true';
    });

    return NextResponse.json({ data: updatedData }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await targetRow.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
