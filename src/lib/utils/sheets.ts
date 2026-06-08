/**
 * Validates a Google Sheets URL and extracts the spreadsheetId and embed URL.
 * Matches formats:
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 */
export function parseGoogleSheetsUrl(url: string): { spreadsheetId: string; embedUrl: string } | null {
  const trimmed = url.trim();
  const regex = /^https?:\/\/(?:docs\.)?google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/.*)?$/;
  const match = trimmed.match(regex);
  if (!match) return null;

  const spreadsheetId = match[1];
  // Construct a standard iframe embedding URL
  const embedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlembed?widget=true&headers=false`;

  return { spreadsheetId, embedUrl };
}
