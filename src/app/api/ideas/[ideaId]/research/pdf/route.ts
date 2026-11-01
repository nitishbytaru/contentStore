import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { saveResearchSource } from '@/lib/research-chat';
import { AlreadyAddedError, sourceKeyForBytes } from '@/lib/research-index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow Vercel functions up to 60s for PDF parsing & embedding

export async function POST(request: Request, context: { params: Promise<{ ideaId: string }> }) {
  try {
    const { ideaId } = await context.params;
    const form = await request.formData();
    const file = form.get('file');
    const title = String(form.get('title') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a PDF to upload' }, { status: 400 });
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files can be added' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    
    // Extract text from the PDF buffer
    let text = '';
    try {
      const extracted = await extractText(bytes, { mergePages: true });
      text = Array.isArray(extracted.text) ? extracted.text.join('\n') : String(extracted.text || '');
    } catch (extractErr) {
      console.error('Error extracting text from PDF:', extractErr);
      throw new Error('Failed to extract readable text from this PDF.');
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'This PDF does not contain readable text (it may be a scanned image).' }, { status: 400 });
    }

    const messages = await saveResearchSource(ideaId, file.name || 'document.pdf', text, title, {
      sourceKey: sourceKeyForBytes(bytes),
      matchName: true,
      maxChunks: 40,
    });

    return NextResponse.json({ data: messages });
  } catch (error: unknown) {
    console.error('PDF upload error in production:', error);
    const message = error instanceof Error ? error.message : 'Could not read that PDF';
    const status = error instanceof AlreadyAddedError ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
