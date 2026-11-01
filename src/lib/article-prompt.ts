import { createClient } from '@/lib/supabase/server';

export async function rewriteArticleWithPrompt(ideaId: string, prompt: string, article: string) {
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
          content:
            'You rewrite one article draft by following the writing instructions you are given. Return only the finished article, ready to publish. Do not explain the rewrite.',
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
