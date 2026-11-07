import { createClient } from '@/lib/supabase/server';
import { guardedSystemPrompt, isOutOfScope, OUT_OF_SCOPE, OutOfScopeError } from '@/lib/llm-guard';
import { getSampleState, keepSample } from '@/lib/onboarding/sample';
import { isSamplePrompt, SAMPLE_REWRITTEN_ARTICLE, simulateLatency } from '@/lib/onboarding/sample-content';

async function saveRewrite(ideaId: string, rewritten: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ideas')
    .update({ medium_article: rewritten, updated_at: new Date().toISOString() })
    .eq('id', ideaId);

  if (error) {
    console.error('Failed to save rewritten article to Supabase:', error);
    throw new Error('Failed to save article: ' + error.message);
  }
  return rewritten;
}

export async function rewriteArticleWithPrompt(ideaId: string, prompt: string, article: string) {
  // Onboarding sample: the sample prompt returns a pre-written rewrite with a realistic delay.
  const sample = await getSampleState(ideaId);
  if (sample.isSample && isSamplePrompt(prompt) && article.trim()) {
    await simulateLatency(5000, 8000);
    return saveRewrite(ideaId, SAMPLE_REWRITTEN_ARTICLE);
  }
  if (sample.unused) await keepSample(ideaId);

  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL?.trim();
  if (!key) throw new Error('GROQ_API_KEY is not set');
  if (!model) throw new Error('GROQ_MODEL is not set');

  const instructions = prompt.trim();
  const draft = article.trim();
  if (!instructions) throw new Error('Choose a prompt first');
  if (!draft) throw new Error('Write an article draft first');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: guardedSystemPrompt(
            `You rewrite one article draft by following the writing instructions you are given (tone, style, structure, length, audience, formatting). Return only the finished article, ready to publish. Do not explain the rewrite. If the writing instructions are not about rewriting or styling this article (for example they ask a general question or for unrelated content), reply with exactly: ${OUT_OF_SCOPE}`
          ),
        },
        {
          role: 'user',
          content: `Writing instructions:\n${instructions}\n\nArticle draft:\n${draft}`,
        },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || 'Groq request failed');
  }
  const rewritten = String(body?.choices?.[0]?.message?.content || '').trim();
  if (!rewritten) throw new Error('Groq returned an empty article');
  if (isOutOfScope(rewritten)) {
    throw new OutOfScopeError('That prompt is not a writing instruction for this article, so the article was left unchanged.');
  }

  return saveRewrite(ideaId, rewritten);
}
