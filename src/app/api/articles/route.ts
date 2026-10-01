import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getArticlesSheet() {
  const doc = await getGoogleSheet();
  let sheet;
  try {
    sheet = doc.sheetsByTitle['Articles'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Articles', headerValues: ['id', 'originalTopic', 'articleContent', 'createdAt', 'updatedAt'] });
    } else {
      await sheet.loadHeaderRow();
      if (!sheet.headerValues.includes('id')) {
         await sheet.setHeaderRow(['id', 'originalTopic', 'articleContent', 'createdAt', 'updatedAt']);
      }
    }
  } catch (e) {
    sheet = await doc.addSheet({ title: 'Articles', headerValues: ['id', 'originalTopic', 'articleContent', 'createdAt', 'updatedAt'] });
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
    const { id, customPrompt, currentContent } = await request.json();
    if (!id || (!customPrompt && !currentContent)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    let updatedContent = currentContent || targetRow.get('articleContent');

    // If customPrompt is provided, iterate with Gemini
    if (customPrompt) {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
      }
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Here is an existing article:\n\n${updatedContent}\n\nUser request for changes: ${customPrompt}\n\nPlease rewrite the article incorporating the requested changes. Keep it in markdown format.`;
      const result = await model.generateContent(prompt);
      updatedContent = result.response.text();
    }

    targetRow.set('articleContent', updatedContent);
    targetRow.set('updatedAt', new Date().toISOString());
    await targetRow.save();

    return NextResponse.json({ 
      data: {
        id: targetRow.get('id'),
        originalTopic: targetRow.get('originalTopic'),
        articleContent: targetRow.get('articleContent'),
        createdAt: targetRow.get('createdAt'),
        updatedAt: targetRow.get('updatedAt'),
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
