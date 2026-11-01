import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchUserPrompts,
  createUserPrompt,
  updateUserPrompt,
  deleteUserPrompt,
} from '@/lib/supabase/prompts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const data = await fetchUserPrompts(supabase);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, category } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newPrompt = await createUserPrompt(supabase, user.id, {
      title,
      content,
      category,
    });

    return NextResponse.json({ data: newPrompt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabase = await createClient();
    const updated = await updateUserPrompt(supabase, id, { title, content });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    await deleteUserPrompt(supabase, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
