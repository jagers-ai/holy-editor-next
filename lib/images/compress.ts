'use client';

// 간단 이미지 압축 유틸: 1MB 미만이 될 때까지 품질/해상도를 단계적으로 낮춰 재인코딩

export interface CompressOptions {
  targetBytes?: number; // 기본 1MB
  initialMaxDim?: number; // 첫 해상도(긴 변) 기본 1280
  initialQuality?: number; // 첫 품질 기본 0.72
}

const DEFAULT_OPTS: Required<CompressOptions> = {
  targetBytes: 1_000_000,
  initialMaxDim: 1280,
  initialQuality: 0.72,
};

function isOldIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iP(hone|od|ad)/.test(ua);
  // 너무 보수적으로 잡지 않고 포맷 폴백만 처리
  return iOS && !('image/webp' in (document.createElement('canvas') as any));
}

async function loadBitmap(file: Blob): Promise<{ bitmap: ImageBitmap; w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  return { bitmap, w: bitmap.width, h: bitmap.height };
}

function drawToCanvas(bitmap: ImageBitmap, maxDim: number): { canvas: HTMLCanvasElement; w: number; h: number } {
  const { width, height } = bitmap;
  const ratio = width >= height ? maxDim / width : maxDim / height;
  const w = Math.max(1, Math.round(width * Math.min(1, ratio)));
  const h = Math.max(1, Math.round(height * Math.min(1, ratio)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { canvas, w, h };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality);
  });
}

export async function compressToUnder(input: Blob, opts?: CompressOptions): Promise<{ blob: Blob; width: number; height: number; iterations: number; mime: string } | null> {
  if (typeof window === 'undefined') return null;
  const { targetBytes, initialMaxDim, initialQuality } = { ...DEFAULT_OPTS, ...opts };

  // 원본이 이미 충분히 작은 경우 그대로 반환(업로드 가속)
  if (input.size <= targetBytes) {
    // 그대로 반환 시 타입 보존
    return { blob: input, width: 0, height: 0, iterations: 0, mime: input.type || 'image/*' };
  }

  const useWebp = !isOldIOS();
  const mime = useWebp ? 'image/webp' : 'image/jpeg';

  const { bitmap } = await loadBitmap(input);
  const qualitySteps = [initialQuality, 0.68, 0.64, 0.6, 0.56, 0.52, 0.48, 0.44, 0.4, 0.36, 0.32, 0.3];
  const dimSteps = [initialMaxDim, 1120, 1024, 896, 800, 720, 640];

  let best: { blob: Blob; w: number; h: number; q: number } | null = null;
  let iterations = 0;

  for (let d = 0; d < dimSteps.length; d++) {
    const { canvas, w, h } = drawToCanvas(bitmap, dimSteps[d]);
    for (let q = 0; q < qualitySteps.length; q++) {
      iterations++;
      const b = await canvasToBlob(canvas, mime, qualitySteps[q]);
      if (!best || b.size < best.blob.size) best = { blob: b, w, h, q: qualitySteps[q] };
      if (b.size <= targetBytes) {
        return { blob: b, width: w, height: h, iterations, mime };
      }
      // 프레임 양보(UX 부드럽게)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  if (best) {
    // 바닥선까지 내려도 1MB 미만이 안 되면 가장 작은 걸 반환
    return { blob: best.blob, width: best.w, height: best.h, iterations, mime };
  }
  return null;
}

