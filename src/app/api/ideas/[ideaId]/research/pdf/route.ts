import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { saveResearchSource } from '@/lib/research-chat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    const text = Array.isArray(extracted.text) ? extracted.text.join('\n') : String(extracted.text || '');
    const messages = await saveResearchSource(ideaId, file.name || 'document.pdf', text, title);
    return NextResponse.json({ data: messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not read that PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
