-- ======================================
-- 🚀 하이브리드 접근법 Supabase 설정
-- ======================================
-- 이 스크립트를 Supabase 대시보드 SQL Editor에서 실행하세요.
-- https://supabase.com/dashboard → 프로젝트 선택 → SQL Editor

-- ======================================
-- 1. users 테이블 생성 (이미 있으면 스킵됨)
-- ======================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- ======================================
-- 2. RLS (Row Level Security) 활성화
-- ======================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- 새 정책 생성
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ======================================
-- 3. 자동 프로필 생성 트리거
-- ======================================
-- 회원가입 시 자동으로 users 테이블에 기본 프로필 생성

-- 함수 생성 (또는 업데이트)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- users 테이블에 기본 정보 삽입
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 삭제 후 재생성 (중복 방지)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ======================================
-- 4. updated_at 자동 갱신 트리거
-- ======================================
-- 프로필 수정 시 updated_at 자동 갱신

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_users_updated ON public.users;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ======================================
-- 5. 기존 auth.users 동기화 (선택사항)
-- ======================================
-- 이미 가입한 사용자들의 프로필 생성

INSERT INTO public.users (id, email, name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ======================================
-- 6. 권한 확인 (디버깅용)
-- ======================================
-- 실행 후 결과 확인
SELECT 
  'Users 테이블 생성' as step,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as success
UNION ALL
SELECT 
  'RLS 활성화' as step,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'users') as success
UNION ALL
SELECT 
  '트리거 생성' as step,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as success
UNION ALL
SELECT 
  '기존 사용자 동기화' as step,
  (SELECT COUNT(*) FROM public.users) > 0 as success;

-- ======================================
-- ✅ 완료 메시지
-- ======================================
-- 모든 설정이 완료되었습니다!
-- 이제 회원가입 시 자동으로 users 테이블에 프로필이 생성됩니다.