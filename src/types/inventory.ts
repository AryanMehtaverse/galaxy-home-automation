export interface InventorySheet {
  id: string;
  name: string;
  originalUrl: string;
  spreadsheetId: string;
  embedUrl: string;
  createdAt: string; // ISO timestamp
  createdBy: {
    uid: string;
    displayName: string;
    email: string;
  };
}
