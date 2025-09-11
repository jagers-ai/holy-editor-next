'use client';

import { createClient } from '@/lib/supabase/client';

function randomId(n = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function uploadImageToStorage(blob: Blob, opts: { docId?: string; ext?: string; bucket?: string } = {}) {
  const supabase = createClient();
  const bucket = opts.bucket || 'sermon-images';
  const ext = (opts.ext || (blob.type.includes('webp') ? 'webp' : 'jpg')).replace('.', '');
  const prefix = opts.docId ? `${opts.docId}` : 'misc';
  const path = `${prefix}/${Date.now()}-${randomId(6)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: false,
    contentType: blob.type,
    cacheControl: '31536000',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('public URL not available');
  return { publicUrl: data.publicUrl, path };
}

