# 🔧 Supabase Storage 이미지 업로드 버그 수정 가이드

## 문제점
에디터에서 카메라로 찍은 사진이 업로드되지 않는 문제
- 원인: `sermon-images` 버킷의 RLS(Row Level Security) 정책 누락
- 증상: "이미지 업로드에 실패했습니다" 토스트 메시지

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/cpujpqxwrcrzdhiiyucp) 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. `scripts/fix-storage-rls-policies.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭

### 방법 2: 로컬에서 실행 (DATABASE_URL 필요)

```bash
# .env.local에서 DIRECT_URL 확인 후
psql "$DIRECT_URL" -f scripts/fix-storage-rls-policies.sql
```

### 방법 3: Prisma를 통한 실행

```bash
npx prisma db execute --file ./scripts/fix-storage-rls-policies.sql
```

## 확인 방법

1. 에디터 페이지 접속: `/editor/new`
2. 카메라 버튼 클릭
3. 사진 촬영 또는 이미지 선택
4. 업로드 성공 확인

## 정책 설명

추가되는 RLS 정책:
- **SELECT**: 모든 사용자가 이미지를 볼 수 있음 (public 읽기)
- **DELETE**: 소유자만 자신의 이미지 삭제 가능
- **UPDATE**: 소유자만 자신의 이미지 수정 가능

## 롤백 방법 (필요시)

```sql
-- 정책 제거
DROP POLICY IF EXISTS "Public read access for sermon images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
```