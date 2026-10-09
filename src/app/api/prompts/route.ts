import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

const HEADERS = ['id', 'title', 'content', 'category', 'createdAt', 'updatedAt'];

async function getPromptsSheet() {
  const doc = await getGoogleSheet();
  let sheet = doc.sheetsByTitle['Prompts'];
  
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Prompts', headerValues: HEADERS });
  } else {
    try {
      await sheet.loadHeaderRow();
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
      await sheet.setHeaderRow(HEADERS);
    }
  }
  return sheet;
}

export async function GET() {
  try {
    const sheet = await getPromptsSheet();
    const rows = await sheet.getRows();
    
    const data = rows.map((row) => {
      return HEADERS.reduce((acc, header) => {
        acc[header] = row.get(header) || '';
        return acc;
      }, {} as any);
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, category } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const sheet = await getPromptsSheet();
    const newPrompt = {
      id: crypto.randomUUID(),
      title,
      content,
      category: category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await sheet.addRow(newPrompt);
    return NextResponse.json({ data: newPrompt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content, category } = body;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const sheet = await getPromptsSheet();
    const rows = await sheet.getRows();
    const rowToUpdate = rows.find(r => r.get('id') === id);

    if (!rowToUpdate) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (title !== undefined) rowToUpdate.assign({ title });
    if (content !== undefined) rowToUpdate.assign({ content });
    if (category !== undefined) rowToUpdate.assign({ category });
    rowToUpdate.assign({ updatedAt: new Date().toISOString() });
    
    await rowToUpdate.save();

    const updatedData = HEADERS.reduce((acc, header) => {
      acc[header] = rowToUpdate.get(header) || '';
      return acc;
    }, {} as any);

    return NextResponse.json({ data: updatedData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const sheet = await getPromptsSheet();
    const rows = await sheet.getRows();
    const rowToDelete = rows.find(r => r.get('id') === id);

    if (!rowToDelete) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    await rowToDelete.delete();
    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
