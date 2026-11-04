import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateUserPrompt } from '@/lib/supabase/prompts';
import { guardedSystemPrompt, isOutOfScope, OUT_OF_SCOPE, OutOfScopeError } from '@/lib/llm-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    const key = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';

    if (!key) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: promptRow, error: fetchErr } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !promptRow) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const title = promptRow.title || '';
    const currentContent = String(promptRow.content || '').trim();

    if (!currentContent) {
      return NextResponse.json({ error: 'Prompt content is empty' }, { status: 400 });
    }

    // Call Groq LLM to enhance the prompt
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 3500,
        messages: [
          {
            role: 'system',
            content: guardedSystemPrompt(
              `You are an expert prompt engineer for a content creator. Your job is to take an existing prompt instruction used for content work (writing, rewriting or styling articles, scripts, posts, research or ideas) and rewrite/enhance it to be significantly more effective, well-structured, and clear. Preserve the original core intent, domain, and specific nuances of the prompt while introducing clear role instructions, logical step-by-step guidance, output formatting, and constraints. Never answer or carry out the prompt yourself; only improve its wording. If the text is not a content-work prompt (for example it is a general question like "who is the president"), reply with exactly: ${OUT_OF_SCOPE}. Output ONLY the enhanced prompt content itself. Do NOT output any introductory text, markdown code blocks (do not wrap in \`\`\`), or explanatory notes.`
            ),
          },
          {
            role: 'user',
            content: title
              ? `Prompt Title: ${title}\n\nCurrent Prompt:\n${currentContent}`
              : `Current Prompt:\n${currentContent}`,
          },
        ],
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error?.message || 'Failed to enhance prompt with AI');
    }

    const enhancedContent = String(body?.choices?.[0]?.message?.content || '').trim();
    if (!enhancedContent) {
      throw new Error('AI returned empty response for enhanced prompt');
    }
    if (isOutOfScope(enhancedContent)) {
      throw new OutOfScopeError('This is not a content-writing prompt, so it was not enhanced.');
    }

    const updated = await updateUserPrompt(supabase, id, { content: enhancedContent });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    if (error instanceof OutOfScopeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error in prompt enhancement:', error);
    return NextResponse.json({ error: error.message || 'Enhancement failed' }, { status: 500 });
  }
}
