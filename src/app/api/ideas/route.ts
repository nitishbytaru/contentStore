import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

// Helper to get the correct sheet and ensure headers exist
async function getIdeasSheet() {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];
  
  // We expect headers: id, idea, status, datePosted, createdAt
  try {
    await sheet.loadHeaderRow();
    if (!sheet.headerValues.includes('id')) {
      await sheet.setHeaderRow(['id', 'idea', 'status', 'datePosted', 'createdAt']);
    }
  } catch (e) {
    // If headers don't exist, set them
    await sheet.setHeaderRow(['id', 'idea', 'status', 'datePosted', 'createdAt']);
  }
  return sheet;
}

export async function GET() {
  try {
    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    
    const data = rows.map((row) => ({
      id: row.get('id'),
      idea: row.get('idea'),
      status: row.get('status'),
      datePosted: row.get('datePosted'),
      createdAt: row.get('createdAt'),
    }));

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
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sheet = await getIdeasSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    targetRow.set('status', 'posted');
    targetRow.set('datePosted', new Date().toISOString());
    await targetRow.save();

    return NextResponse.json({ 
      data: {
        id: targetRow.get('id'),
        idea: targetRow.get('idea'),
        status: targetRow.get('status'),
        datePosted: targetRow.get('datePosted'),
        createdAt: targetRow.get('createdAt'),
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
