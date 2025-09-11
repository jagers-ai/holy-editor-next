-- Fix Storage RLS Policies for sermon-images bucket
-- Date: 2025-09-11
-- Issue: 이미지 업로드 후 publicUrl을 가져올 수 없는 문제 해결

-- 1. SELECT 정책: 모든 사용자가 sermon-images 버킷의 이미지를 읽을 수 있도록 허용
-- 이 정책이 없으면 public 버킷이어도 이미지를 읽을 수 없음
CREATE POLICY "Public read access for sermon images" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'sermon-images');

-- 2. DELETE 정책: 소유자만 자신의 이미지를 삭제할 수 있도록 허용
-- 폴더 구조: {userId}/{docId}/{timestamp-random}.{ext}
CREATE POLICY "Users can delete own images" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'sermon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. UPDATE 정책: 소유자만 자신의 이미지를 수정할 수 있도록 허용
CREATE POLICY "Users can update own images" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'sermon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 정책이 올바르게 적용되었는지 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%sermon%'
ORDER BY policyname;