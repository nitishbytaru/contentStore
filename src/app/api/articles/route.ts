import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      
      // Ensure all required headers exist without deleting existing ones
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

export async function GET() {
  try {
    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    
    const data = rows.map((row) => ({
      id: row.get('id'),
      originalTopic: row.get('originalTopic'),
      articleContent: row.get('articleContent'),
      xPostContent: row.get('xPostContent') || '',
      videoPromptContent: row.get('videoPromptContent') || '',
      createdAt: row.get('createdAt'),
      updatedAt: row.get('updatedAt'),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Convert the following rough description into a highly structured, engaging, and professional article. Use markdown formatting (headings, bullet points, etc.).\n\nDescription: ${topic}`;
    
    const result = await model.generateContent(prompt);
    const articleContent = result.response.text();

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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let updatedField = '';
    let updatedContent = '';

    const articleContent = targetRow.get('articleContent');

    if (action === 'edit_article') {
      updatedField = 'articleContent';
      updatedContent = content;
    } else if (action === 'iterate_article') {
      if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
      const prompt = `Here is an existing article:\n\n${articleContent}\n\nUser request for changes: ${customPrompt}\n\nPlease rewrite the article incorporating the requested changes. Keep it in markdown format.`;
      const result = await model.generateContent(prompt);
      updatedField = 'articleContent';
      updatedContent = result.response.text();
    } else if (action === 'generate_x_post') {
      if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
      const prompt = `Based on the following article, create a highly engaging Twitter/X thread. The first tweet must be a catchy hook. Format the thread nicely, using numbers or emojis. \n\nAdditional instructions from user (if any): ${customPrompt || 'None'}\n\nArticle Data:\n${articleContent}`;
      const result = await model.generateContent(prompt);
      updatedField = 'xPostContent';
      updatedContent = result.response.text();
    } else if (action === 'edit_x_post') {
      updatedField = 'xPostContent';
      updatedContent = content;
    } else if (action === 'generate_video_prompt') {
      if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
      const prompt = `Based on the following article, generate a detailed video prompt and script outline for a short-form video (TikTok, Reels, Shorts) or a YouTube video. Include visual cues and voiceover lines. \n\nAdditional instructions from user (if any): ${customPrompt || 'None'}\n\nArticle Data:\n${articleContent}`;
      const result = await model.generateContent(prompt);
      updatedField = 'videoPromptContent';
      updatedContent = result.response.text();
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
