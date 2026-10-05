import { getGoogleSheet } from '@/lib/google-sheets';

export async function getArticlesSheet() {
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
