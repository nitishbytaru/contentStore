import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

const CATEGORY_HEADERS = ['id', 'name', 'createdAt'];

async function getCategoriesSheet(doc: any) {
  let sheet = doc.sheetsByTitle['PromptCategories'];
  if (!sheet) {
    try {
      sheet = await doc.addSheet({ title: 'PromptCategories', headerValues: CATEGORY_HEADERS });
    } catch {
      sheet = doc.sheetsByTitle['PromptCategories'];
    }
  } else {
    try {
      await sheet.loadHeaderRow();
      let currentHeaders = [...sheet.headerValues];
      let headersModified = false;
      for (const header of CATEGORY_HEADERS) {
        if (!currentHeaders.includes(header)) {
          currentHeaders.push(header);
          headersModified = true;
        }
      }
      if (headersModified) {
        await sheet.setHeaderRow(currentHeaders);
      }
    } catch (e) {
      await sheet.setHeaderRow(CATEGORY_HEADERS);
    }
  }
  return sheet;
}

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    const categoriesSheet = await getCategoriesSheet(doc);
    const catRows = await categoriesSheet.getRows();

    const categoryNames = new Set<string>(['General']);

    // 1. Add categories explicitly saved in PromptCategories sheet
    catRows.forEach((row: any) => {
      const name = (row.get('name') || '').trim();
      if (name) categoryNames.add(name);
    });

    // 2. Also harvest categories currently used in Prompts sheet so existing ones are retained
    const promptsSheet = doc.sheetsByTitle['Prompts'];
    if (promptsSheet) {
      try {
        const promptRows = await promptsSheet.getRows();
        promptRows.forEach((row: any) => {
          const cat = (row.get('category') || '').trim();
          if (cat) categoryNames.add(cat);
        });
      } catch (err) {
        console.warn('Could not read Prompts sheet for categories:', err);
      }
    }

    // Sort categories: 'General' first, then alphabetical
    const sorted = Array.from(categoryNames).sort((a, b) => {
      if (a.toLowerCase() === 'general') return -1;
      if (b.toLowerCase() === 'general') return 1;
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    return NextResponse.json({ data: sorted }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    // Fallback to default categories if sheets connection has issues
    return NextResponse.json({ data: ['General'] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: 'Category name must be under 50 characters' }, { status: 400 });
    }

    const doc = await getGoogleSheet();
    const categoriesSheet = await getCategoriesSheet(doc);
    const rows = await categoriesSheet.getRows();

    // Check if category already exists (case-insensitive)
    const existing = rows.find(
      (r: any) => (r.get('name') || '').trim().toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return NextResponse.json({ data: existing.get('name') }, { status: 200 });
    }

    const newRow = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    await categoriesSheet.addRow(newRow);

    return NextResponse.json({ data: name }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
