export const defaultQueryOptions = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
} as const;

export function withDefaults<T extends object>(opts?: T): T & typeof defaultQueryOptions {
  if (opts) {
    return { ...opts, ...defaultQueryOptions };
  }
  return { ...defaultQueryOptions } as T & typeof defaultQueryOptions;
}

export function folderDocsOptions(folderId: string) {
  return {
    ...defaultQueryOptions,
    placeholderData: <TData>(prev: TData) => prev,
    enabled: Boolean(folderId),
  } as const;
}
