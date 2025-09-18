export interface DocumentIdentifier {
  id: string;
}

export interface DocumentTimestamps {
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DocumentListEntry extends DocumentIdentifier, DocumentTimestamps {
  title: string | null;
  content: unknown;
  folderId?: string | null;
  isPublic?: boolean;
}

export type DocumentList = DocumentListEntry[];

export interface DocumentDetail extends DocumentListEntry {
  title: string;
  folderId: string | null;
  isPublic: boolean;
}

export interface DocumentRevision extends DocumentIdentifier {
  documentId: string;
  userId?: string | null;
  content: unknown;
  createdAt: string | Date;
}

export type DocumentRevisionList = DocumentRevision[];
