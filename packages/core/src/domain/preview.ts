import { DEFAULT_PREVIEW_LIMIT } from './constants';

export interface PreviewOptions { limit?: number }
type TiptapNode = { text?: unknown; content?: unknown[] };

export function extractPlainTextFromTiptap(doc: unknown, opts?: PreviewOptions): string {
  try {
    const limit = opts?.limit ?? DEFAULT_PREVIEW_LIMIT;
    const root = doc as TiptapNode;
    const output: string[] = [];
    let total = 0;
    const extract = (node: unknown) => {
      if (!node || total >= limit) return;
      const n = node as TiptapNode;
      if (typeof n.text === 'string') {
        const remaining = limit - total;
        const slice = n.text.slice(0, remaining);
        output.push(slice);
        total += slice.length;
      }
      if (Array.isArray(n.content)) {
        for (const child of n.content) {
          if (total >= limit) break;
          extract(child);
        }
      }
    };
    extract(root);
    return output.join(' ').trim();
  } catch {
    return '';
  }
}

