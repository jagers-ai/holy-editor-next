import { DEFAULT_PREVIEW_LIMIT } from '@/lib/domain/constants';

export interface PreviewOptions { limit?: number }

// TipTap JSON에서 텍스트만 추출(상한 도달 시 조기 중단)
export function extractPlainTextFromTiptap(doc: unknown, opts?: PreviewOptions): string {
  try {
    const limit = opts?.limit ?? DEFAULT_PREVIEW_LIMIT;
    const root: any = doc as any;
    if (!root || typeof root !== 'object' || !('content' in root)) return '';
    const texts: string[] = [];
    let total = 0;
    const extract = (node: any) => {
      if (!node || total >= limit) return;
      if (node.text) {
        const remaining = limit - total;
        const slice = String(node.text).slice(0, remaining);
        texts.push(slice);
        total += slice.length;
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          if (total >= limit) break;
          extract(child);
        }
      }
    };
    extract(root);
    return texts.join(' ').trim();
  } catch {
    return '';
  }
}

