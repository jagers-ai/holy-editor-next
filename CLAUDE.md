# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code (claude.ai/code)에게 지침을 제공합니다.

⚠️ **중요**: Claude Code의 날짜 버그로 인해 날짜가 1월로 표시될 수 있습니다. 
실제 현재 KST 날짜를 확인하려면 다음 명령어를 실행하세요:
```bash
# 한국 시간(KST) 확인
TZ='Asia/Seoul' date '+%Y년 %m월 %d일 %H:%M:%S KST'

# 또는 Node.js로 확인
node -e "console.log(new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'}))"
```

## 📖 Holy Editor - 성경 구절 삽입 에디터

성경 구절을 쉽게 삽입하고 편집할 수 있는 웹 기반 에디터입니다.

### 핵심 기술 스택
- **프레임워크**: Next.js 15 with App Router + TypeScript
- **에디터**: Tiptap 3 (ProseMirror 기반 리치 텍스트 에디터)
- **스타일링**: Tailwind CSS 4 + Radix UI 컴포넌트
- **데이터베이스**: Supabase를 통한 PostgreSQL + Prisma ORM
- **상태 관리**: TanStack Query (React Query)
- **폼 처리**: React Hook Form + Zod 검증
- **API**: tRPC를 통한 타입 안전 API
- **모니터링**: Sentry + PostHog
- **인증**: Supabase Auth (구현 예정)

## 🏗️ 프로젝트 구조

```
holy-editor-next/
├── app/                        # Next.js App Router 페이지
│   ├── editor/[id]/           # 동적 라우팅을 사용한 에디터 페이지
│   ├── documents/             # 문서 관리 페이지
│   └── api/                   # API 라우트 (현재 비어있음)
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
│   └── layout/                # 레이아웃 컴포넌트
├── lib/
│   ├── bible/                 # 성경 관련 유틸리티
│   │   └── books.ts          # 성경 책 정의 및 유틸리티
│   ├── posthog.ts            # PostHog 분석 도구 설정
│   └── utils.ts              # 일반 유틸리티
└── prisma/
    ├── migrations/            # 데이터베이스 마이그레이션 파일들
    └── schema.prisma          # 데이터베이스 스키마

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

## 💡 주요 구현 세부사항

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

### 에디터 상태 관리
- Tiptap의 내장 상태 관리 사용
- 문서 내용은 데이터베이스에 JSON으로 저장
- 에디터의 `onUpdate` 이벤트를 사용하여 자동 저장 기능 구현 가능

### 데이터베이스 스키마
✅ **완료**: Holy Editor 전용 스키마가 성공적으로 적용되었습니다!

**현재 데이터베이스 테이블:**
- `users` - 사용자 관리 (Supabase Auth 연동 예정)
- `documents` - 문서 저장 (Tiptap JSON 형식)
- `bible_references` - 성경 구절 참조
- `tags` - 태그 시스템
- `document_tags` - 문서-태그 연결
- `templates` - 설교 템플릿

⚠️ **중요**: 현재 문서는 **localStorage에만 저장**되고 있습니다. 
데이터베이스 연동 코드는 아직 구현되지 않았습니다.

## 🔧 환경 변수

`.env.local` 파일 생성:
```env
# Supabase 데이터베이스 URL
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# Supabase 설정 (인증 및 스토리지용 - 구현 예정)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# 모니터링 (선택사항)
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

⚠️ **중요**: 
- DATABASE_URL에는 풀러 연결(포트 6543) 사용
- DIRECT_URL에는 직접 연결(포트 5432) 사용 (마이그레이션에 필요)

## 🎯 기능 로드맵

현재 구현된 기능:
- Tiptap을 사용한 리치 텍스트 편집
- 책/장/절 선택을 통한 성경 구절 삽입
- 문서 생성 및 편집

향후 개선 사항:
- 문서 영속성 및 관리
- 사용자 인증
- 협업 편집
- 다양한 형식으로 내보내기 (PDF, Word 등)
- 성경 구절 검색 및 상호 참조
- 설교 템플릿 및 개요
- 노트 작성 및 주석

## 🐛 일반적인 문제 해결

1. **포트 충돌**: 포트 3000이 사용 중이면 앱이 자동으로 3002를 사용
2. **Prisma Client 오류**: 스키마 변경 후 항상 `npx prisma generate` 실행
3. **Next.js 캐시 문제**: 이상한 빌드 오류 발생 시 `.next` 폴더 삭제
4. **데이터베이스 연결**: DATABASE_URL과 DIRECT_URL이 올바르게 설정되었는지 확인
5. **Turbopack**: 이 프로젝트는 빠른 빌드를 위해 Turbopack을 사용. 문제 발생 시 package.json 스크립트에서 `--turbopack` 플래그 제거

---
*최종 업데이트: 2025-09-03*