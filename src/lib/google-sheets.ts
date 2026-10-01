import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

/**
 * Initializes and returns a GoogleSpreadsheet instance.
 * Automatically handles authentication using the environment variables.
 */
export const getGoogleSheet = async () => {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    throw new Error('Google Sheets credentials are not fully configured in environment variables.');
  }

  // Formatting the private key to handle newline characters correctly when passed via environment variables
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Initialize auth
  const jwt = new JWT({
    email: serviceAccountEmail,
    key: formattedPrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(sheetId, jwt);
  
  // Load document properties and worksheets
  await doc.loadInfo(); 
  
  return doc;
};
