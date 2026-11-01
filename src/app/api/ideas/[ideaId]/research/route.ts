import { NextResponse } from 'next/server';
import { askResearch, saveResearchSource } from '@/lib/research-chat';
import { listResearchMessages } from '@/lib/research-messages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const messages = await listResearchMessages(ideaId);
    return NextResponse.json({ data: messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load research';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const title = typeof body.title === 'string' ? body.title : '';
    const mode = body.mode === 'source' ? 'source' : 'ask';

    if (!content) {
      return NextResponse.json({ error: 'Write a note or a question first' }, { status: 400 });
    }

    const messages = mode === 'source'
      ? await saveResearchSource(ideaId, 'Pasted note', content, title)
      : await askResearch(ideaId, content, title);

    return NextResponse.json({ data: messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Research failed';
    const status = message.includes('GROQ_API_KEY') || message.includes('GROQ_MODEL') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
