import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

const HEADERS = [
  'id', 'idea', 'status', 'datePosted', 'createdAt',
  'baseArticle', 'mediumArticle', 'youtubeScript',
  'eligibleMedium', 'eligibleSubstack', 'eligibleX', 'eligibleYoutube', 'eligibleInstagram',
  'publishedMedium', 'publishedSubstack', 'publishedX', 'publishedYoutube', 'publishedInstagram'
];

const BOOLEAN_FIELDS = [
  'eligibleMedium', 'eligibleSubstack', 'eligibleX', 'eligibleYoutube', 'eligibleInstagram',
  'publishedMedium', 'publishedSubstack', 'publishedX', 'publishedYoutube', 'publishedInstagram'
];

// Helper to get the correct sheet and ensure headers exist
async function getIdeasSheet() {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];
  
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
      await sheet.setHeaderRow(currentHeaders);
    }
  } catch (e) {
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
        acc[header] = targetRow.get(header) || '';
        return acc;
      }, {} as any);
      // parse booleans
      BOOLEAN_FIELDS.forEach(key => {
        data[key] = data[key] === 'true';
      });
      return NextResponse.json({ data }, { status: 200 });
    }

    const data = rows.map((row) => {
      const rowData = HEADERS.reduce((acc, header) => {
        acc[header] = row.get(header) || '';
        return acc;
      }, {} as any);
      // parse booleans
      BOOLEAN_FIELDS.forEach(key => {
        rowData[key] = rowData[key] === 'true';
      });
      return rowData;
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { idea } = await request.json();
    
    if (!idea) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    const sheet = await getIdeasSheet();
    const newIdea = {
      id: crypto.randomUUID(),
      idea,
      status: 'pending',
      datePosted: '',
      createdAt: new Date().toISOString(),
      baseArticle: '',
      mediumArticle: '',
      youtubeScript: '',
      eligibleMedium: 'false',
      eligibleSubstack: 'false',
      eligibleX: 'false',
      eligibleYoutube: 'false',
      eligibleInstagram: 'false',
      publishedMedium: 'false',
      publishedSubstack: 'false',
      publishedX: 'false',
      publishedYoutube: 'false',
      publishedInstagram: 'false'
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
    if (payload.status === 'posted') {
      targetRow.set('datePosted', new Date().toISOString());
    } else if (payload.status === 'pending') {
      targetRow.set('datePosted', '');
    }

    await targetRow.save();

    const updatedData = HEADERS.reduce((acc, header) => {
      acc[header] = targetRow.get(header) || '';
      return acc;
    }, {} as any);
    
    BOOLEAN_FIELDS.forEach(key => {
      updatedData[key] = updatedData[key] === 'true';
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
