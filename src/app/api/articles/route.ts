import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const AI_CONFIG = {
  geminiModel: 'gemini-3.8-flash',
  groqModel: 'openai/gpt-oss-20b',
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithFallback(prompt: string, operation: string): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`[AI] provider=gemini model=${AI_CONFIG.geminiModel} operation=${operation} status=retry retry=${attempt}`);
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
        await sleep(delay);
      } else {
        console.log(`[AI] Gemini request started. operation=${operation}`);
      }

      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
      
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.geminiModel });
      const result = await model.generateContent(prompt);
      
      console.log(`[AI] Gemini request succeeded. operation=${operation}`);
      return result.response.text();

    } catch (error: any) {
      const msg = error.message || '';
      console.error(`[AI] Gemini request failed. operation=${operation} error=${msg}`);

      const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('timeout') || msg.includes('demand');
      
      if (!isTransient || attempt === maxRetries) {
        if (attempt === maxRetries) {
          console.log(`[AI] Gemini exhausted retries. operation=${operation}`);
        }
        break; 
      }
      attempt++;
    }
  }

  console.log(`[AI] Falling back to Groq. operation=${operation}`);
  try {
    console.log(`[AI] Groq request started. operation=${operation}`);
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy') {
      throw new Error('GROQ_API_KEY is not configured');
    }
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: AI_CONFIG.groqModel,
    });
    
    console.log(`[AI] Groq request succeeded. operation=${operation}`);
    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error(`[AI] Groq request failed. operation=${operation} error=${error.message || 'Unknown'}`);
    throw new Error('AI generation is temporarily unavailable. Please try again shortly.');
  }
}

async function getArticlesSheet() {
  const doc = await getGoogleSheet();
  let sheet;
  const desiredHeaders = ['id', 'originalTopic', 'articleContent', 'xPostContent', 'videoPromptContent', 'createdAt', 'updatedAt'];

  try {
    sheet = doc.sheetsByTitle['Articles'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Articles', headerValues: desiredHeaders });
    } else {
      await sheet.loadHeaderRow();
      
      let currentHeaders = [...sheet.headerValues];
      let headersModified = false;
      
      for (const header of desiredHeaders) {
        if (!currentHeaders.includes(header)) {
          currentHeaders.push(header);
          headersModified = true;
        }
      }

      if (headersModified) {
        await sheet.setHeaderRow(currentHeaders);
      }
    }
  } catch (e) {
    sheet = await doc.addSheet({ title: 'Articles', headerValues: desiredHeaders });
  }
  return sheet;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    
    let data = rows.map((row) => ({
      id: row.get('id'),
      originalTopic: row.get('originalTopic'),
      articleContent: row.get('articleContent'),
      xPostContent: row.get('xPostContent') || '',
      videoPromptContent: row.get('videoPromptContent') || '',
      createdAt: row.get('createdAt'),
      updatedAt: row.get('updatedAt'),
    }));

    if (id) {
      data = data.filter(d => d.id === id);
      if (data.length > 0) return NextResponse.json({ data: data[0] }, { status: 200 });
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const prompt = `Convert the following rough description into a highly structured, engaging, and professional article. Use markdown formatting (headings, bullet points, etc.).\n\nDescription: ${topic}`;
    
    const articleContent = await generateWithFallback(prompt, 'article');

    const sheet = await getArticlesSheet();
    const newArticle = {
      id: crypto.randomUUID(),
      originalTopic: topic,
      articleContent,
      xPostContent: '',
      videoPromptContent: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await sheet.addRow(newArticle);

    return NextResponse.json({ data: newArticle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, action, customPrompt, content } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    let updatedField = '';
    let updatedContent = '';

    const articleContent = targetRow.get('articleContent');

    if (action === 'edit_article') {
      updatedField = 'articleContent';
      updatedContent = content;
    } else if (action === 'iterate_article') {
      const prompt = `Here is an existing article:\n\n${articleContent}\n\nUser request for changes: ${customPrompt}\n\nPlease rewrite the article incorporating the requested changes. Keep it in markdown format.`;
      updatedContent = await generateWithFallback(prompt, 'iterate_article');
      updatedField = 'articleContent';
    } else if (action === 'generate_x_post') {
      const prompt = `You are an expert at converting long technical articles into concise, engaging X (Twitter) threads.

Your task is to read the entire article provided by the user and transform it into:

1. ONE HOOK POST
2. A SHORT FOLLOWING THREAD

The goal is NOT to summarize every sentence. Extract the most important ideas and explain them as a short, easy-to-follow story.

━━━━━━━━━━━━━━━━━━━━
HOOK FORMAT
━━━━━━━━━━━━━━━━━━━━

Start with a strong curiosity-driven hook.

The hook should:
- Usually begin with a personal realization, mistake, problem, or surprising observation.
- Create curiosity about the technical concept.
- Make the reader want to continue reading.
- Clearly introduce the main topic.
- Feel natural and conversational.
- Avoid sounding like a textbook or marketing copy.

Preferred structure:

"I thought [common assumption].

Then I discovered/experienced [surprising problem].

That made me ask:

"[interesting question]"

That's when I started understanding [topic]. 🧵"

Do NOT always copy this exact structure. Adapt it naturally to the article.

The hook should be concise.

━━━━━━━━━━━━━━━━━━━━
THREAD FORMAT
━━━━━━━━━━━━━━━━━━━━

After the hook, create a numbered thread:

1/7
2/7
3/7
...

The number of tweets should depend on the complexity of the article.

Prefer SHORT threads.

Usually aim for 6–10 tweets.

Do NOT create unnecessary tweets just to cover every detail.

Each tweet must contain one clear idea.

━━━━━━━━━━━━━━━━━━━━
STRICT CHARACTER LIMIT
━━━━━━━━━━━━━━━━━━━━

EVERY SINGLE TWEET MUST BE UNDER 280 CHARACTERS.

This includes:
- The tweet number (e.g. 1/8)
- Spaces
- Punctuation
- Emojis
- Markdown characters

Never exceed 280 characters.

Prefer keeping tweets comfortably below the limit rather than trying to reach 280 exactly.

━━━━━━━━━━━━━━━━━━━━
WRITING STYLE
━━━━━━━━━━━━━━━━━━━━

Use:
- Simple English
- Conversational language
- Short sentences
- Clear explanations
- Natural storytelling
- Technical accuracy

Avoid:
- Academic language
- Corporate language
- Excessive explanation
- Long paragraphs
- Unnecessary filler
- Repeating the same idea
- Overly dramatic claims
- Marketing-style language

The thread should feel like a developer sharing something they genuinely learned.

━━━━━━━━━━━━━━━━━━━━
STORY STRUCTURE
━━━━━━━━━━━━━━━━━━━━

Whenever possible, structure the thread like this:

1. Hook / problem
2. Initial assumption
3. Discovery
4. Explanation of the concept
5. Important distinction
6. Deeper problem or realization
7. Practical implication
8. Final mental model / takeaway

Do not force this structure if the article naturally follows another progression.

The thread should have a logical flow where each tweet naturally leads to the next.

━━━━━━━━━━━━━━━━━━━━
TECHNICAL ACCURACY
━━━━━━━━━━━━━━━━━━━━

Do not blindly copy technically incorrect statements from the article.

If necessary:
- Correct inaccurate terminology.
- Remove misleading claims.
- Simplify without changing the meaning.
- Avoid overclaiming.

Do not introduce unrelated concepts that are not necessary for understanding the article.

━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━

Use examples only when they make the concept significantly easier to understand.

Do NOT use code snippets, diagrams, ASCII graphs, or technical flows unless the user explicitly asks for them.

When the user asks for plain-text tweets, keep everything in normal prose.

━━━━━━━━━━━━━━━━━━━━
ENDING
━━━━━━━━━━━━━━━━━━━━

The final tweet should usually provide a concise mental model, lesson, or takeaway.

For example:

"The important distinction I learned was:

Training → changes what the model learns.
RAG → gives the model information when it needs it.

They aren't replacements for each other.
They solve different problems."

Do not force a question or CTA at the end unless it naturally fits the topic.

━━━━━━━━━━━━━━━━━━━━
IMPORTANT RULES
━━━━━━━━━━━━━━━━━━━━

1. Never exceed 280 characters in ANY tweet.
2. Keep the thread short and precise.
3. Do not over-explain.
4. Do not turn every paragraph of the article into a tweet.
5. Remove redundant information.
6. Preserve the author's personal learning journey when present.
7. Maintain technical accuracy.
8. Make the thread understandable even to someone who is familiar with programming but doesn't know the specific concept.
9. Don't make the writing sound AI-generated.
10. Prefer clarity over completeness.
11. Do not add unnecessary emojis. Use 🧵 in the hook and occasional emojis only when they naturally fit.
12. Do not use code snippets, graphs, diagrams, or flows unless explicitly requested.
13. Before finalizing, internally verify the character count of EVERY tweet.
14. If a tweet exceeds 280 characters, rewrite it until it is safely under the limit.

━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━

Return only this structure:

### Hook

[Hook tweet]

### Thread

**1/N**
[Tweet]

**2/N**
[Tweet]

...

**N/N**
[Final tweet]

Do not provide explanations, analysis, character counts, or alternative versions unless the user asks for them.

━━━━━━━━━━━━━━━━━━━━
INPUT DATA
━━━━━━━━━━━━━━━━━━━━
Additional instructions from user (if any): ${customPrompt || 'None'}

Article Data:
${articleContent}`;
      updatedContent = await generateWithFallback(prompt, 'generate_x_post');
      updatedField = 'xPostContent';
    } else if (action === 'edit_x_post') {
      updatedField = 'xPostContent';
      updatedContent = content;
    } else if (action === 'generate_video_prompt') {
      const prompt = `Based on the following article, generate a detailed video prompt and script outline for a short-form video (TikTok, Reels, Shorts) or a YouTube video. Include visual cues and voiceover lines. \n\nAdditional instructions from user (if any): ${customPrompt || 'None'}\n\nArticle Data:\n${articleContent}`;
      const generatedContent = await generateWithFallback(prompt, 'generate_video_prompt');
      
      const appendString = `\n\nFormat: 9:16 vertical animated video, 15–20 seconds duration.
Style: Clean flat-design 2.5D vector illustration, modern tech aesthetic, vibrant minimalist color palette on a neutral dark/light slate background. Bold outlines, smooth motion graphics, isometric perspective.

Subject / Scene Breakdown:
- 00:00–00:04 (The Trigger): Large, distinct isometric graphic representing [Client Device / Incoming Request]. [Action: emits a glowing data packet moving along an animated pathway].
- 00:04–00:10 (The Core Mechanism): The packet enters [Central Component: e.g., Middleware / Rate Limiter / Gateway]. Visual mechanism activates [e.g., counter increments / security shield scans / token bucket fills or drops]. Clear, prominent visual cue: [e.g., green checkmark for pass, smooth red deflection for block].
- 00:10–00:15 (The Destination): Allowed packet flows seamlessly into [Target: e.g., Backend Server Cluster / Database node]. The target component pulses with a gentle glow and returns an instant response payload back along the line.

Text & UI Constraints:
- Minimal text. Max 1–2 bold floating labels (e.g., "[LABEL 1]", "[LABEL 2]").
- No complex terminal dumps or paragraphs; rely entirely on visual metaphors and motion flow.

Camera & Motion:
- Fixed isometric angle with a subtle push-in toward the central component during the evaluation phase.
- Snappy, high-frame-rate easing curves (ease-in-out) for all component movements.

Audio & SFX Cues:
- Soft digital whoosh on packet dispatch.
- Crisp UI click / chime during component processing.
- Low resonant hum for server/database acknowledgment.`;

      updatedContent = generatedContent + appendString;
      updatedField = 'videoPromptContent';
    } else if (action === 'edit_video_prompt') {
      updatedField = 'videoPromptContent';
      updatedContent = content;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    targetRow.set(updatedField, updatedContent);
    targetRow.set('updatedAt', new Date().toISOString());
    await targetRow.save();

    return NextResponse.json({ 
      data: {
        id: targetRow.get('id'),
        originalTopic: targetRow.get('originalTopic'),
        articleContent: targetRow.get('articleContent') || '',
        xPostContent: targetRow.get('xPostContent') || '',
        videoPromptContent: targetRow.get('videoPromptContent') || '',
        createdAt: targetRow.get('createdAt'),
        updatedAt: targetRow.get('updatedAt'),
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    await targetRow.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
