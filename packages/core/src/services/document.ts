import type {
  DocumentDetail,
  DocumentList,
  DocumentRevisionList,
} from '../domain/document';
import type { SermonInfo } from '../domain/sermon';

export interface DocumentListParams {
  limit?: number;
  cursor?: string;
  folderId?: string;
}

export interface DocumentCreateInput {
  title: string;
  content: unknown;
  sermonInfo?: Partial<SermonInfo> & { date?: string };
  isPublic?: boolean;
  folderId?: string;
}

export interface DocumentUpdateInput {
  title?: string;
  content?: unknown;
  sermonInfo?: Partial<SermonInfo> & { date?: string };
  isPublic?: boolean;
  folderId?: string;
  expectedHash?: string;
}

export interface DocumentListResult {
  documents: DocumentList;
  nextCursor?: string;
}

export interface DocumentService {
  list(params?: DocumentListParams): Promise<DocumentListResult>;
  getById(id: string): Promise<DocumentDetail>;
  create(input: DocumentCreateInput): Promise<DocumentDetail>;
  update(id: string, input: DocumentUpdateInput): Promise<DocumentDetail>;
  delete(id: string): Promise<void>;
  getRevisions(documentId: string, limit?: number): Promise<DocumentRevisionList>;
  restoreFromRevision(documentId: string, revisionId: string): Promise<DocumentDetail>;
}
