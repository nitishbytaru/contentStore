import { NextResponse } from 'next/server';
import { getPromptsSheet, parseRowToPrompt } from '@/lib/prompts-sheet';

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

    const sheet = await getPromptsSheet();
    const rows = await sheet.getRows();
    const rowToUpdate = rows.find((r) => r.get('id') === id);

    if (!rowToUpdate) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const title = rowToUpdate.get('title') || '';
    const currentContent = String(rowToUpdate.get('content') || '').trim();

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
            content:
              'You are an expert AI prompt engineer. Your job is to take an existing prompt instruction and rewrite/enhance it to be significantly more effective, high-performing, well-structured, and clear. Preserve the original core intent, domain, and specific nuances of the prompt while introducing clear role instructions, logical step-by-step guidance, output formatting, and constraints. Output ONLY the enhanced prompt content itself. Do NOT output any introductory text, markdown code blocks (do not wrap in ```), or explanatory notes.',
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
      throw new Error(body?.error?.message || 'Failed to enhance prompt with AI model');
    }

    let enhanced = String(body?.choices?.[0]?.message?.content || '').trim();

    // Clean any accidental markdown fence wrapper
    if (enhanced.startsWith('```') && enhanced.endsWith('```')) {
      enhanced = enhanced.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    if (!enhanced) {
      throw new Error('AI returned an empty response');
    }

    // Directly update and save to Google Sheets
    rowToUpdate.set('content', enhanced);
    rowToUpdate.set('updatedAt', new Date().toISOString());
    await rowToUpdate.save();

    return NextResponse.json({ data: parseRowToPrompt(rowToUpdate) }, { status: 200 });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
