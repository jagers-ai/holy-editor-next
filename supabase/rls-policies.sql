-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================
-- 이 SQL 스크립트를 Supabase Dashboard의 SQL Editor에서 실행하세요.
-- URL: https://supabase.com/dashboard/project/cpujpqxwrcrzdhiiyucp/sql
-- ============================================

-- 1. RLS 활성화 (각 테이블에 대해)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Users 테이블 정책
-- ============================================

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 신규 사용자 생성은 인증된 사용자만 가능 (회원가입 시)
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. Documents 테이블 정책
-- ============================================

-- 자신의 문서 조회 + public 문서 조회
CREATE POLICY "Users can view own documents and public documents" 
ON public.documents FOR SELECT 
USING (
  auth.uid() = "userId" 
  OR 
  "isPublic" = true
);

-- 자신의 문서만 생성 가능
CREATE POLICY "Users can create own documents" 
ON public.documents FOR INSERT 
WITH CHECK (auth.uid() = "userId");

-- 자신의 문서만 수정 가능
CREATE POLICY "Users can update own documents" 
ON public.documents FOR UPDATE 
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- 자신의 문서만 삭제 가능
CREATE POLICY "Users can delete own documents" 
ON public.documents FOR DELETE 
USING (auth.uid() = "userId");

-- ============================================
-- 4. Bible References 테이블 정책
-- ============================================

-- 문서 소유자만 bible_references 조회 가능 + public 문서의 references
CREATE POLICY "Users can view bible references of accessible documents" 
ON public.bible_references FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = bible_references."documentId" 
    AND (documents."userId" = auth.uid() OR documents."isPublic" = true)
  )
);

-- 자신의 문서에만 bible_references 생성 가능
CREATE POLICY "Users can create bible references for own documents" 
ON public.bible_references FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = "documentId" 
    AND documents."userId" = auth.uid()
  )
);

-- 자신의 문서의 bible_references만 수정 가능
CREATE POLICY "Users can update bible references of own documents" 
ON public.bible_references FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = bible_references."documentId" 
    AND documents."userId" = auth.uid()
  )
);

-- 자신의 문서의 bible_references만 삭제 가능
CREATE POLICY "Users can delete bible references of own documents" 
ON public.bible_references FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = bible_references."documentId" 
    AND documents."userId" = auth.uid()
  )
);

-- ============================================
-- 5. Tags 테이블 정책
-- ============================================

-- 모든 사용자가 태그 조회 가능
CREATE POLICY "Anyone can view tags" 
ON public.tags FOR SELECT 
USING (true);

-- 인증된 사용자는 태그 생성 가능
CREATE POLICY "Authenticated users can create tags" 
ON public.tags FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 태그 수정은 관리자만 (현재는 비활성화)
-- CREATE POLICY "Only admins can update tags" 
-- ON public.tags FOR UPDATE 
-- USING (false);

-- 태그 삭제는 관리자만 (현재는 비활성화)
-- CREATE POLICY "Only admins can delete tags" 
-- ON public.tags FOR DELETE 
-- USING (false);

-- ============================================
-- 6. Document Tags 테이블 정책
-- ============================================

-- 접근 가능한 문서의 태그만 조회 가능
CREATE POLICY "Users can view tags of accessible documents" 
ON public.document_tags FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_tags."documentId" 
    AND (documents."userId" = auth.uid() OR documents."isPublic" = true)
  )
);

-- 자신의 문서에만 태그 연결 가능
CREATE POLICY "Users can add tags to own documents" 
ON public.document_tags FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = "documentId" 
    AND documents."userId" = auth.uid()
  )
);

-- 자신의 문서의 태그 연결만 삭제 가능
CREATE POLICY "Users can remove tags from own documents" 
ON public.document_tags FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_tags."documentId" 
    AND documents."userId" = auth.uid()
  )
);

-- ============================================
-- 7. Templates 테이블 정책
-- ============================================

-- 공개 템플릿과 자신의 템플릿 조회 가능
CREATE POLICY "Users can view public templates and own templates" 
ON public.templates FOR SELECT 
USING (
  "isPublic" = true 
  OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()
  )
);

-- 인증된 사용자만 템플릿 생성 가능
CREATE POLICY "Authenticated users can create templates" 
ON public.templates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 템플릿 수정은 관리자만 (현재는 비활성화)
-- CREATE POLICY "Only admins can update templates" 
-- ON public.templates FOR UPDATE 
-- USING (false);

-- 템플릿 삭제는 관리자만 (현재는 비활성화)
-- CREATE POLICY "Only admins can delete templates" 
-- ON public.templates FOR DELETE 
-- USING (false);

-- ============================================
-- 8. 유용한 RLS 헬퍼 함수 (선택사항)
-- ============================================

-- 현재 사용자가 문서 소유자인지 확인하는 함수
CREATE OR REPLACE FUNCTION public.is_document_owner(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = doc_id 
    AND "userId" = auth.uid()
  );
$$;

-- 현재 사용자가 문서에 접근 가능한지 확인하는 함수
CREATE OR REPLACE FUNCTION public.can_access_document(doc_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = doc_id 
    AND ("userId" = auth.uid() OR "isPublic" = true)
  );
$$;

-- ============================================
-- 완료 메시지
-- ============================================
-- RLS 정책 설정이 완료되었습니다!
-- 
-- 다음 단계:
-- 1. Supabase Dashboard의 SQL Editor에서 이 스크립트를 실행하세요
-- 2. Authentication > Policies 메뉴에서 정책이 적용되었는지 확인하세요
-- 3. 앱에서 로그인 후 데이터 CRUD 작업을 테스트하세요
-- ============================================