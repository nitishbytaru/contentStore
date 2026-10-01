import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    
    // We assume the data is in the first sheet (index 0)
    const sheet = doc.sheetsByIndex[0];
    
    // Load rows
    const rows = await sheet.getRows();
    
    // Extract headers
    const headers = sheet.headerValues;
    
    // Map rows into objects
    const data = rows.map((row) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header) => {
        rowData[header] = row.get(header);
      });
      return rowData;
    });

    return NextResponse.json({ 
      title: doc.title,
      sheetTitle: sheet.title,
      data 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching data from Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content from the database.', details: error.message },
      { status: 500 }
    );
  }
}
