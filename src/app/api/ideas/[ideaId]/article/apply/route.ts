import { NextResponse } from 'next/server';
import { OutOfScopeError } from '@/lib/llm-guard';
import { rewriteArticleWithPrompt } from '@/lib/article-prompt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const article = typeof body.article === 'string' ? body.article : '';
    const mediumArticle = await rewriteArticleWithPrompt(ideaId, prompt, article);
    return NextResponse.json({ data: { mediumArticle } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'The article could not be rewritten';
    const status = error instanceof OutOfScopeError || message.includes('GROQ_API_KEY') || message.includes('GROQ_MODEL') || message.includes('first')
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
