import { NextResponse } from 'next/server';
import { PromptItem } from '@/types';
import { getPromptsSheet, parseRowToPrompt } from '@/lib/prompts-sheet';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheet = await getPromptsSheet();
    const rows = await sheet.getRows();
    const data = rows.map(parseRowToPrompt);

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
    const newPrompt: PromptItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      category: (category || 'General').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await sheet.addRow(newPrompt as any);
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
    const rowToUpdate = rows.find((r) => r.get('id') === id);

    if (!rowToUpdate) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (title !== undefined) rowToUpdate.set('title', title.trim());
    if (content !== undefined) rowToUpdate.set('content', content.trim());
    if (category !== undefined) rowToUpdate.set('category', (category || 'General').trim());
    rowToUpdate.set('updatedAt', new Date().toISOString());

    await rowToUpdate.save();

    return NextResponse.json({ data: parseRowToPrompt(rowToUpdate) }, { status: 200 });
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
    const rowToDelete = rows.find((r) => r.get('id') === id);

    if (!rowToDelete) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    await rowToDelete.delete();
    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
