# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

🚨 **매우 중요 - Claude Code 날짜 버그**: 
Claude Code는 현재 날짜를 **항상 1월**로 잘못 인식하는 심각한 버그가 있습니다.
**절대 Claude의 날짜 인식을 믿지 마세요!** 
반드시 아래 명령어로 실제 날짜를 확인하세요:
```bash
# 한국 시간(KST) 확인
TZ='Asia/Seoul' date '+%Y년 %m월 %d일 %H:%M:%S KST'

# 또는 Node.js로 확인
node -e "console.log(new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}))"
```

## 📖 Holy Editor - 성경 구절 삽입 에디터

성경 구절을 쉽게 삽입하고 편집할 수 있는 웹 기반 에디터입니다.

### 핵심 기술 스택
- **프레임워크**: Next.js 15.5.0 with App Router + TypeScript 5
- **에디터**: Tiptap 3.3.x (ProseMirror 기반 리치 텍스트 에디터)
- **스타일링**: Tailwind CSS 4 + Radix UI 컴포넌트
- **애니메이션**: tw-animate-css
- **데이터베이스**: Supabase PostgreSQL + Prisma ORM
- **인증**: Supabase Auth (SSR 클라이언트)
- **상태 관리**: TanStack Query (React Query)
- **폼 처리**: React Hook Form + Zod 검증
- **API**: tRPC를 통한 타입 안전 API
- **로깅**: Winston + Daily Rotate File
- **에러 처리**: React Error Boundary + React Hot Toast
- **파일 처리**: xlsx (엑셀 import/export)
- **모니터링**: Sentry + PostHog
- **런타임**: React 19.1.0 + Turbopack

## 🏗️ 프로젝트 구조

```
holy-editor-next/
├── app/                        # Next.js App Router 페이지
│   ├── (auth)/                # 인증 관련 페이지 그룹
│   │   ├── login/            # 로그인 페이지
│   │   └── signup/           # 회원가입 페이지
│   ├── editor/[id]/          # 동적 라우팅을 사용한 에디터 페이지
│   ├── documents/             # 문서 관리 페이지
│   └── api/trpc/[trpc]/      # tRPC API 엔드포인트
├── components/
│   ├── editor/                # 에디터 관련 컴포넌트
│   │   ├── HolyEditor.tsx    # 메인 에디터 컴포넌트
│   │   ├── Toolbar.tsx       # 에디터 툴바
│   │   ├── SermonInfoSection.tsx  # 설교 정보 입력 섹션
│   │   └── extensions/       # 커스텀 Tiptap 확장
│   │       ├── BibleVerseExtension.ts   # 성경 구절 확장 로직
│   │       ├── BibleVerseNode.ts        # ProseMirror 노드 정의
│   │       └── BibleVerseComponent.tsx  # 렌더링용 React 컴포넌트
│   ├── ui/                    # 재사용 가능한 UI 컴포넌트 (Radix 기반)
│   ├── layout/                # 레이아웃 컴포넌트
│   ├── auth/                  # 인증 관련 컴포넌트
│   ├── error/                 # 에러 처리 컴포넌트
│   └── system/                # 시스템 컴포넌트
├── server/
│   └── api/                   # 서버 사이드 API
│       ├── trpc.ts           # tRPC 설정 (publicProcedure, protectedProcedure)
│       ├── root.ts           # API 라우터 루트
│       └── routers/          # API 라우터들
│           ├── auth.ts       # 인증 API
│           └── document.ts   # 문서 API
├── lib/
│   ├── bible/                 # 성경 관련 유틸리티
│   │   └── books.ts          # 성경 책 정의 및 유틸리티
│   ├── supabase/             # Supabase 클라이언트 설정
│   │   ├── client.ts         # 브라우저 클라이언트
│   │   └── server.ts         # 서버 클라이언트 (SSR)
│   ├── errors/               # 에러 처리 유틸리티
│   │   ├── global-handler.ts # 글로벌 에러 핸들러
│   │   └── types.ts          # 에러 타입 정의
│   ├── logger.ts             # Winston 로거 설정
│   ├── posthog.ts            # PostHog 분석 도구 설정
│   └── utils.ts              # 일반 유틸리티
├── hooks/                     # 커스텀 React 훅
├── contexts/                  # React Context providers
├── types/                     # TypeScript 타입 정의
├── utils/                     # 유틸리티 함수
├── prisma/
│   ├── migrations/            # 데이터베이스 마이그레이션 파일들
│   └── schema.prisma          # 데이터베이스 스키마
└── server/
    └── db.ts                  # Prisma 클라이언트 인스턴스
```

## 🚀 개발 명령어

### 필수 명령어
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Turbopack 사용)
npm run dev
# 서버는 포트 3000에서 실행 (3000이 사용 중이면 3002)
# 네트워크 접근을 위해 http://0.0.0.0:3000으로 접근 가능

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린팅
npm run lint

# 린팅 자동 수정
npm run lint:fix
```

### 데이터베이스 명령어
```bash
# 데이터베이스 마이그레이션 실행
npm run db:migrate

# Prisma Studio 열기 (데이터베이스 GUI)
npm run db:studio

# 데이터베이스 시드
npm run db:seed

# Prisma Client 생성 (스키마 변경 후)
npx prisma generate
```

### 데이터베이스 마이그레이션 워크플로우 (Supabase)
Prisma 스키마 변경 시:
```bash
# 1. 마이그레이션 생성 및 적용 (Supabase 직접 연결 사용)
npm run db:migrate
# 또는 수동으로:
npx prisma migrate dev --name migration-name

# 2. Prisma Client 재생성 (필수!)
npx prisma generate

# 3. Next.js 캐시 정리
rm -rf .next

# 4. 개발 서버 재시작
npm run dev
```

**마이그레이션 문제 발생 시 빠른 복구:**
```bash
npx prisma generate && rm -rf .next && npm run dev
```

## 🔐 환경 변수

`.env.local` 파일 생성:
```env
# ⚠️ Vercel 배포 필수 설정 (PgBouncer)
# DATABASE_URL은 반드시 포트 6543 + ?pgbouncer=true 사용
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
# Service Role Key (서버 사이드 전용)
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# 모니터링 (선택사항)
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
SENTRY_AUTH_TOKEN="your_auth_token"
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### ⚠️ Vercel 배포 시 중요 설정

**Connection Pooling 필수:**
- DATABASE_URL: 반드시 포트 `6543` + `?pgbouncer=true` 사용
- DIRECT_URL: 마이그레이션용 포트 `5432` 직접 연결
- 이 설정이 없으면 `prepared statement "s1" already exists` 에러 발생

**왜 필요한가?**
- Vercel의 서버리스 환경은 연결이 자주 생성/해제됨
- PgBouncer 없이 5432 포트 사용 시 prepared statement 충돌 발생
- Connection pooling으로 연결 재사용 및 안정성 확보

## 🗂️ Supabase Storage 설정

에디터의 이미지 업로드를 위한 Storage 설정:

### 버킷 생성
1. Supabase 대시보드 → Storage
2. 새 버킷 생성:
   - 이름: `sermon-images`
   - Public: ✅ (읽기 공개)

### 정책(Policies) 설정
```sql
-- 읽기 정책 (모든 사용자)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'sermon-images');

-- 업로드 정책 (인증된 사용자)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sermon-images' AND
  auth.role() = 'authenticated'
);

-- 삭제 정책 (소유자만)
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sermon-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 업로드 경로 구조
```
/{userId}/{docId}/{timestamp-rand}.webp
```

## 💻 API 사용 예시

### tRPC 클라이언트 사용

```typescript
import { api } from '@/lib/trpc/client';

// 문서 목록 조회 (publicProcedure)
const { data: documents, isLoading } = api.document.list.useQuery();

// 문서 생성 (protectedProcedure - 로그인 필요)
const createDocument = api.document.create.useMutation({
  onSuccess: (data) => {
    console.log('문서 생성 성공:', data);
    router.push(`/editor/${data.id}`);
  },
  onError: (error) => {
    toast.error(error.message);
  }
});

// 사용
await createDocument.mutateAsync({
  title: "새 설교문",
  content: tiptapJSON,
  isPublic: false
});
```

### Supabase Auth 사용

```typescript
import { createClient } from '@/lib/supabase/client';

// 로그인
const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 현재 사용자 가져오기
const { data: { user } } = await supabase.auth.getUser();

// 로그아웃
await supabase.auth.signOut();
```

### Winston 로깅

```typescript
import { logger } from '@/lib/logger';

// 로그 레벨: error, warn, info, debug
logger.info('문서 저장 시작', { 
  documentId: doc.id,
  userId: user.id 
});

logger.error('API 오류 발생', { 
  error: error.message,
  stack: error.stack,
  userId: user?.id
});

// API 요청 로깅 (자동)
logApiRequest('POST', '/api/document', 200, 125); // method, path, status, duration(ms)
```

### 에러 처리 패턴

```typescript
import { GlobalErrorHandler } from '@/lib/errors/global-handler';
import { ErrorCategory, ErrorSeverity } from '@/lib/errors/types';

// 글로벌 에러 핸들러 사용
try {
  // 위험한 작업
  await riskyOperation();
} catch (error) {
  const appError = GlobalErrorHandler.createAppError(
    error.message,
    ErrorCategory.API,
    ErrorSeverity.HIGH,
    '작업을 완료할 수 없습니다.'
  );
  
  GlobalErrorHandler.handleError(appError, 'DocumentService', user?.id);
}
```

## 💡 주요 구현 세부사항

### tRPC 구조
- **publicProcedure**: 인증 불필요한 공개 API
- **protectedProcedure**: 로그인 필수 API
- **에러 처리 미들웨어**: 모든 API 호출 자동 로깅
- **SuperJSON**: Date, Map, Set 등 복잡한 타입 자동 직렬화

### 커스텀 성경 구절 확장
에디터에는 성경 구절 삽입을 위한 커스텀 Tiptap 확장이 포함되어 있습니다:

1. **BibleVerseExtension.ts**: 핵심 확장 로직, 사용자 입력과 명령 처리
2. **BibleVerseNode.ts**: ProseMirror 노드 사양, 데이터 구조 정의
3. **BibleVerseComponent.tsx**: 에디터에서 구절을 렌더링하는 React 컴포넌트
4. **Toolbar.tsx**: 성경 구절 삽입을 위한 UI 포함
5. **SermonInfoSection.tsx**: 설교 정보 (제목, 날짜, 설교자 등) 입력 섹션

확장 기능으로 가능한 작업:
- 모달 인터페이스를 통한 성경 구절 삽입
- 책, 장, 절 범위 선택
- 적절한 형식으로 구절을 인라인 표시
- 삽입된 구절 편집 또는 삭제

### 데이터베이스 스키마
**현재 테이블 구조:**
- `users` - 사용자 관리 (Supabase Auth와 연동)
- `documents` - 문서 저장 (Tiptap JSON 형식)
- `bible_references` - 성경 구절 참조
- `tags` - 태그 시스템
- `document_tags` - 문서-태그 연결
- `templates` - 설교 템플릿

## 🐛 트러블슈팅

### Vercel 배포 문제

**"prepared statement 's1' already exists" 에러**
- 원인: DATABASE_URL이 직접 연결(5432)을 사용 중
- 해결: DATABASE_URL을 pooler 연결(6543)로 변경
```env
# ❌ 잘못된 설정
DATABASE_URL="postgresql://...@host:5432/postgres"

# ✅ 올바른 설정
DATABASE_URL="postgresql://...@host:6543/postgres?pgbouncer=true"
```

**Connection pool 에러**
- `&connection_limit=1` 파라미터 추가
- Vercel 환경 변수에서 직접 수정

### Prisma 관련

**Client 오류**
```bash
# Prisma Client 재생성
npx prisma generate

# 캐시 정리 후 재시작
rm -rf .next node_modules/.prisma
npm install
npm run dev
```

**마이그레이션 실패**
```bash
# 기존 마이그레이션 리셋 (주의: 데이터 손실)
npx prisma migrate reset

# 새로 마이그레이션 생성
npx prisma migrate dev --name init
```

### Turbopack 문제

개발 서버에서 이상한 동작이 발생하면:
```bash
# package.json의 dev 스크립트에서 --turbopack 제거
"dev": "next dev"  # --turbopack 제거됨
```

### 포트 충돌
포트 3000이 사용 중이면 자동으로 3002 사용. 수동 변경:
```bash
PORT=3001 npm run dev
```

### 이미지 업로드 실패 (Supabase Storage RLS)

**"new row violates row-level security policy" 에러**
- 원인: 업로드 경로가 RLS 정책과 불일치 또는 브라우저 캐시
- 증상: 로그인했는데도 이미지 업로드 실패

**해결 방법:**
1. **즉시 해결 (브라우저)**
   ```bash
   # 모바일: 시크릿 모드 사용
   # 데스크톱: Ctrl+Shift+R (하드 리프레시)
   ```

2. **코드 확인**
   ```javascript
   // uploadImage.ts - 경로 형식 확인
   const path = `${userPrefix}/${docPrefix}/${filename}`;
   // 반드시: {userId}/misc/... 형식이어야 함
   ```

3. **Next.js 캐시 문제**
   ```bash
   # 캐시 삭제 후 재시작
   rm -rf .next node_modules/.cache
   npm run dev
   ```

4. **RLS 정책 확인**
   ```sql
   -- Supabase Dashboard에서 실행
   -- SELECT 정책 (읽기 허용) 필수
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'sermon-images');
   ```

**⚠️ 주의**: 코드 수정 후 반드시 커밋하고 서버 재시작!

## ⚡ 성능 최적화

### React Query 캐싱
```typescript
// 캐싱 전략 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      cacheTime: 1000 * 60 * 10, // 10분
      refetchOnWindowFocus: false,
    },
  },
});
```

### 이미지 최적화
- 업로드 시 자동 WebP 변환
- Next.js Image 컴포넌트 사용
- Supabase CDN 활용

### Turbopack 활용
- 개발 환경에서 빠른 HMR
- 증분 컴파일로 빌드 시간 단축

## 🔒 보안 고려사항

### Supabase RLS (Row Level Security)
```sql
-- 문서 접근 정책
CREATE POLICY "Users can CRUD own documents" ON documents
USING (auth.uid() = user_id OR is_public = true);
```

### API 보호
- tRPC의 protectedProcedure로 인증 필수 엔드포인트 보호
- Supabase Auth JWT 토큰 검증
- Service Role Key는 서버 사이드에서만 사용

### 환경 변수 관리
- `.env.local`은 절대 커밋하지 않음
- Vercel 환경 변수 사용
- Service Role Key는 서버 환경에서만 설정

---
*최종 업데이트: 2025-09-11*