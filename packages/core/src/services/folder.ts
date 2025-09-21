import type { DocumentList } from '../domain/document';
import type { FolderList, FolderSummary } from '../domain/folder';

export interface FolderCreateInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface FolderUpdateInput extends FolderCreateInput {
  id: string;
}

export interface MoveDocumentsInput {
  documentIds: string[];
  targetFolderId: string;
}

export interface MoveDocumentsResult {
  movedCount: number;
  targetFolder: string;
}

export interface NormalizeResult {
  folderId: string;
  movedCount: number;
}

export interface FolderService {
  list(): Promise<FolderList>;
  getById(id: string): Promise<FolderSummary>;
  getDocuments(folderId: string): Promise<DocumentList>;
  create(input: FolderCreateInput): Promise<FolderSummary>;
  update(input: FolderUpdateInput): Promise<FolderSummary>;
  delete(id: string): Promise<void>;
  moveDocuments(input: MoveDocumentsInput): Promise<MoveDocumentsResult>;
  normalizeUncategorized(): Promise<NormalizeResult>;
}
