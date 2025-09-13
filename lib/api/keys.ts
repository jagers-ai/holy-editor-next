export const qk = {
  folder: (id: string) => ['folder', id] as const,
  folderDocs: (id: string) => ['folderDocs', id] as const,
  document: (id: string) => ['document', id] as const,
};

