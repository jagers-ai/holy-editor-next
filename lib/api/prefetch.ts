import { RouterPort } from '@/ports/router';

export async function prefetchFolder(router: RouterPort, utils: { folder: { getById: { prefetch: (a: { id: string }) => Promise<unknown> }, getDocuments: { prefetch: (a: { folderId: string }) => Promise<unknown> } } }, folderId: string): Promise<void> {
  const query = new URLSearchParams({ folderId });
  router.prefetch?.(`/documents?${query.toString()}`);
  await utils.folder.getById.prefetch({ id: folderId });
  await utils.folder.getDocuments.prefetch({ folderId });
}
