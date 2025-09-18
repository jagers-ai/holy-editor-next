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
