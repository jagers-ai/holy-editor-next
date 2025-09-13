import { RouterPort } from '@/ports/router';

export async function prefetchFolder(router: RouterPort, utils: any, folderId: string): Promise<void> {
  try { router.prefetch?.(`/folders/${folderId}`); } catch {}
  try { await utils.folder.getById.prefetch({ id: folderId }); } catch {}
  try { await utils.folder.getDocuments.prefetch({ folderId }); } catch {}
}

