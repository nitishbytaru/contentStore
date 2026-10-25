import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

const CATEGORY_HEADERS = ['id', 'name', 'createdAt'];

let isCategoriesSheetInitialized = false;

async function getCategoriesSheet(doc: any) {
  let sheet = doc.sheetsByTitle['PromptCategories'];
  if (!sheet) {
    try {
      sheet = await doc.addSheet({ title: 'PromptCategories', headerValues: CATEGORY_HEADERS });
    } catch {
      sheet = doc.sheetsByTitle['PromptCategories'];
    }
    isCategoriesSheetInitialized = true;
  } else if (!isCategoriesSheetInitialized) {
    try {
      await sheet.loadHeaderRow();
      const currentHeaders = [...sheet.headerValues];
      const missingHeaders = CATEGORY_HEADERS.filter((h) => !currentHeaders.includes(h));
      if (missingHeaders.length > 0) {
        await sheet.setHeaderRow([...currentHeaders, ...missingHeaders]);
      }
    } catch {
      await sheet.setHeaderRow(CATEGORY_HEADERS);
    }
    isCategoriesSheetInitialized = true;
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
    for (const row of catRows) {
      const name = (row.get('name') || '').trim();
      if (name) categoryNames.add(name);
    }

    // 2. Also harvest categories currently used in Prompts sheet
    const promptsSheet = doc.sheetsByTitle['Prompts'];
    if (promptsSheet) {
      try {
        const promptRows = await promptsSheet.getRows();
        for (const row of promptRows) {
          const cat = (row.get('category') || '').trim();
          if (cat) categoryNames.add(cat);
        }
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
      return NextResponse.json({
        data: (existing.get('name') || '').trim(),
        message: 'Category already exists'
      }, { status: 200 });
    }

    const newRow = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    await categoriesSheet.addRow(newRow);

    return NextResponse.json({
      data: name,
      message: 'Category created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
