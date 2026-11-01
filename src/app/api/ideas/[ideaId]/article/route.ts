import { NextResponse } from 'next/server';
import { generateArticleFromResearch } from '@/lib/research-chat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const mediumArticle = await generateArticleFromResearch(ideaId);
    return NextResponse.json({ data: { mediumArticle } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Article generation failed';
    const status = message.includes('GROQ_API_KEY') || message.includes('GROQ_MODEL') || message.includes('Ask a few')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
