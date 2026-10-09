import { NextResponse } from 'next/server';
import { getArticlesSheet } from '@/lib/articles-db';

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
    const { topic, articleContent } = await request.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const sheet = await getArticlesSheet();
    const newArticle = {
      id: crypto.randomUUID(),
      originalTopic: topic,
      articleContent: articleContent || '',
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
    const { id, action, content } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const sheet = await getArticlesSheet();
    const rows = await sheet.getRows();
    const targetRow = rows.find(r => r.get('id') === id);

    if (!targetRow) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    let updatedField = '';

    if (action === 'edit_article') {
      updatedField = 'articleContent';
    } else if (action === 'edit_x_post') {
      updatedField = 'xPostContent';
    } else if (action === 'edit_video_prompt') {
      updatedField = 'videoPromptContent';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    targetRow.set(updatedField, content);
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
