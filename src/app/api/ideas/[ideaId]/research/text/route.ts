import { NextResponse } from 'next/server';
import { saveResearchSource } from '@/lib/research-chat';
import { AlreadyAddedError, sourceKeyForText } from '@/lib/research-index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const title = typeof body.title === 'string' ? body.title : '';
    if (!content) {
      return NextResponse.json({ error: 'Paste some text first' }, { status: 400 });
    }

    const messages = await saveResearchSource(ideaId, 'Pasted text', content, title, {
      sourceKey: sourceKeyForText(content),
      maxChunks: 160,
    });
    return NextResponse.json({ data: messages });
  } catch (error: unknown) {
    console.error('Research text POST error:', error);
    const message = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as { message: unknown }).message)
        : 'Could not save that text';
    const status = error instanceof AlreadyAddedError ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
