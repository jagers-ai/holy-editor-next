export interface FolderIdentifier {
  id: string;
}

export interface FolderSummary extends FolderIdentifier {
  name: string;
  icon: string | null;
  color?: string | null;
  documentCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type FolderList = FolderSummary[];
