'use client';

import { createClient } from '@/lib/supabase/client';

function randomId(n = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function uploadImageToStorage(
  blob: Blob,
  opts: { docId?: string; ext?: string; bucket?: string } = {}
) {
  const supabase = createClient();
  const bucket = opts.bucket || 'sermon-images';
  const ext = (opts.ext || (blob.type.includes('webp') ? 'webp' : 'jpg')).replace('.', '');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userPrefix = user?.id ? user.id : 'anon';
  const docPrefix = opts.docId ? opts.docId : 'misc';
  const path = `${userPrefix}/${docPrefix}/${Date.now()}-${randomId(6)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    upsert: false,
    contentType: blob.type,
    cacheControl: '31536000',
  });
  if (error) {
    // 보다 친절한 메시지 제공(버킷 없음/권한 없음 구분)
    const msg = String(error.message || error);
    if (/not found|does not exist|No such file or directory/i.test(msg)) {
      throw new Error(`Storage 버킷 "${bucket}"을(를) 찾을 수 없습니다.`);
    }
    if (/Unauthorized|permission|policy|RLS/i.test(msg)) {
      throw new Error('Storage 업로드 권한이 없습니다(정책/로그인 확인).');
    }
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('public URL not available');
  return { publicUrl: data.publicUrl, path };
}
