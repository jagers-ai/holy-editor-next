import { RouterPort } from '@/ports/router';

export async function prefetchFolder(router: RouterPort, utils: { folder: { getById: { prefetch: (a: { id: string }) => Promise<unknown> }, getDocuments: { prefetch: (a: { folderId: string }) => Promise<unknown> } } }, folderId: string): Promise<void> {
  router.prefetch?.(`/folders/${folderId}`);
  await utils.folder.getById.prefetch({ id: folderId });
  await utils.folder.getDocuments.prefetch({ folderId });
}
