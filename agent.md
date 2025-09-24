# 에이전트 운영 가이드 (Holy Editor Next)

> ❗️**매우 중요**: Reasoning/Thinking 내용은 언제나 **100% 한국어**로 작성해야 합니다. 영어 문장은 절대 금지입니다.
> 📌 동일한 언어·Reasoning 정책이 `instructions.md`와 `CODEX.md`에도 복제되어 있으며, 이 문서(`agent.md`)를 최종 기준으로 유지합니다.

이 문서는 Codex CLI/에이전트가 본 저장소에서 일하는 방법을 정리한 실전 가이드입니다. 간결하고 안전하게, 필요한 작업을 빠르게 끝내는 것을 목표로 합니다.

## 언어·Reasoning 정책
- 기본 언어는 한국어입니다. 사용자가 “영어로 답해”라고 지시한 해당 턴을 제외하고 영어 문장을 쓰지 않습니다.
- Reasoning Summary(생각/사고 요약)와 모든 내부 추론 공유는 한국어 결과 요약으로만 제공합니다. Chain-of-Thought 원문은 노출 금지.
- 코드/명령/경로/로그 등은 원문 그대로 표기하되, 바로 아래 한 줄 한국어 설명을 추가합니다.
- UI에 thinking/Reasoning Summary 블록이 보이면 본문은 반드시 한국어로 작성합니다.

## 프로젝트 개요
- 스택: Next.js 15.5.0(App Router) · React 19.1.0 · TypeScript 5 · Turbopack · tRPC 11.5 · Prisma 6.14 · Supabase(PostgreSQL) · Tailwind CSS 4 · Tiptap 3 · Sentry · PostHog.
- 워크스페이스: npm workspaces 구조(`apps/*`, `packages/*`). 웹 앱은 루트 `app/`, Expo 모바일은 `apps/mobile/`, 공용 도메인은 `packages/core/`.
- 실행 스크립트(`package.json`:1 참고): `npm install`, `npm run dev`, `npm run build`, `npm run start`, `npm run mobile`, `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`, `npm run setup:hooks`.
- 주요 디렉터리
  - `app/`: 라우팅, 페이지 컴포넌트, `api/trpc/[trpc]/route.ts`.
  - `components/`: UI, 에디터, 확장(`components/editor/extensions/*`), `components/ui/`(shadcn/ui 기반).
  - `server/`: tRPC 라우터(`server/api/routers/{auth,document,folder}.ts`), `server/api/root.ts`, Prisma 클라이언트(`server/db.ts`).
  - `lib/`: 로거, 에러 헬퍼, Supabase SSR 클라이언트, 도메인 유틸.
  - `adapters/`, `ports/`: 플랫폼별 구현(`adapters/web/*`)과 추상 포트(`ports/auth.ts`, `ports/toast.ts` 등).
  - `supabase/`: SQL 스크립트, RLS 정책 자료.
  - `prisma/`: `schema.prisma`, `migrations/`, `seed.ts`.
  - `public/`, `docs/`, `scripts/`, `data/`, `backups/`: 정적 자산, 문서, 자동화 스크립트, 샘플 데이터, 백업.

## 빠른 시작
1. 의존성 설치: `npm install`
2. 환경 변수 준비: `.env.example`를 복사해 `.env.local` 작성 후 `DATABASE_URL`(6543 + `?pgbouncer=true`), `DIRECT_URL`(5432), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, 선택값(PostHog, Sentry 등)을 채웁니다.
3. 개발 서버: `npm run dev` (Turbopack, 기본 http://localhost:3000 / 필요 시 `npm run mobile`로 Expo 워크스페이스 실행).
4. 프로덕션 확인: `npm run build && npm run start`.
5. Prisma 워크플로: 스키마 변경 시 `npx prisma generate` → `npm run db:migrate` → `npm run db:studio` → 서버 재기동.
6. 훅/검증 준비: `npm run setup:hooks`로 .githooks 경로 설정, `npm run lint` 또는 `npm run lint:fix`로 린트 실행.

참고: Supabase 마이그레이션은 5432(Direct 연결), 런타임은 6543(PgBouncer) 사용을 권장합니다. 포트가 반대로 설정되면 커넥션 오류가 발생합니다.

## 코딩/작업 규칙(에이전트)
- 변경 최소화: 요청 범위 내에서만 정확히 수정. 스타일은 기존 코드와 일관.
- 커밋 메시지: 제목과 본문 모두 한국어로 작성. 영어 표현은 금지하며, 필요한 경우 고유명만 원문 유지. 메시지는 가능한 한 자세하게 작성하고, 각 PR·이슈마다 아래 형식을 1세트로 포함한다.
  - `문제 정의: …`
  - `예상 사용자/이해관계자 영향: …` (필요 시 개발자·CEO 등 명시)
  - `원인: …`
  - `해결 방안: …` (쉬운 용어로 상세히)
  - 로컬 훅 설정: 루트에서 `npm run setup:hooks` 또는 `bash scripts/setup-hooks.sh`를 한 번 실행하면 `.githooks/commit-msg`가 설정되어 위 4가지 항목을 자동 검증한다. 규칙을 수정했을 때는 `agent.md`를 최신 상태로 저장한 뒤 그대로 커밋한다.
- 패치 적용: 파일 수정은 반드시 `apply_patch` 사용. 큰 파일은 필요한 부분만 변경.
- 계획 수립: 복잡 작업은 `update_plan`으로 단계 공유. 간단 작업은 생략 가능.
  - 계획을 제시할 땐 **PR 번호별**로 다음 순서를 지켜 서술한다: `문제 정의 → 사용자 불편 → 해결 방안`. 예)
    - `문제 정의: …`
    - `사용자 불편: …`
    - `해결 방안: …`
  - 상기 형식은 에이전트가 제안하는 모든 향후 계획에도 동일하게 적용한다.
- 커맨드 실행 전 프리앰블: 무엇을 할지 1–2문장으로 알리고 실행.
- 셸 사용
  - 기본 셸은 `bash`입니다. 명령 실행 시 `rg`, `sed`, `npx`, `apply_patch` 등 리눅스 도구를 우선 사용합니다.
  - PowerShell이 필요한 경우에만 `pwsh -NoLogo -Command "…"` 형식으로 호출합니다.
  - 긴 출력은 250줄 이내로 나누어 확인합니다.
- 보안/비밀값: `.env.local` 등 민감정보는 출력/로그 금지. 외부 공유 금지. 로그에는 마스킹 처리.
- 위험 작업: 데이터 삭제, 히스토리 재작성 등의 파괴적 작업은 반드시 사용자 확인 후 진행.

## MCP 도구 활용
- Sequential Thinking MCP는 자동으로 기동됩니다. 복잡한 작업·분석이 필요하면 `sequentialthinking` 도구로 단계별 계획을 수립하고 필요 시 수정합니다.
- 기술 문서가 필요하면 `context7__resolve-library-id` → `context7__get-library-docs` 순으로 호출합니다. React/Tiptap 등은 공식 문서를 우선 사용합니다.
- MCP 연결 오류 발생 시 `node -v`, `npm -v`, `npm view @modelcontextprotocol/server-sequential-thinking version`으로 환경을 점검하고, 결과와 함께 사용자에게 보고합니다.

## 아키텍처 지침
- tRPC
  - 서버: `server/api/routers/*`에 라우터 추가, `server/api/root.ts`에 등록.
  - 입력 검증: Zod 스키마 필수. `publicProcedure`/`protectedProcedure` 사용.
  - 에러: `lib/errors/global-handler.ts`의 글로벌 핸들러와 `errorHandlingMiddleware`가 로깅/서식화.
  - 클라이언트: 컴포넌트에서는 `utils/api.ts`의 `api.xxx.useQuery/useMutation` 사용. 앱 루트는 `app/providers.tsx`의 `TRPCReactProvider`가 컨텍스트 주입.
- Prisma/DB
  - 스키마: `prisma/schema.prisma` 수정 → `npx prisma generate` → `npm run db:migrate`.
  - 로깅: 개발 환경에서 쿼리/에러 로그 활성(`server/db.ts`).
  - Supabase 연결 시 마이그레이션은 5432(Direct), 앱 런타임은 Pooler(선택) 사용 권장.
- Supabase Auth(준비중)
  - SSR 미들웨어 `lib/supabase/middleware.ts`가 세션 갱신, `createTRPCContext`엔 TODO. 인증 연동 작업 시 여기부터 보완.
- 에디터(Tiptap)
  - 커스텀 노드: `components/editor/extensions/*` 참고. 전역 `window.bibleData` 로컬 JSON 프리로드 사용.
  - SSR 이슈 회피: 에디터 페이지는 `dynamic(..., { ssr: false })` 로 렌더.
- 로깅/모니터링
  - `lib/logger.ts`의 헬퍼 사용(`logApiRequest`, `logPerformance`, `logError` 등). 콘솔 일원화.
  - Sentry/PostHog 키가 없으면 비활성 상태로 동작하도록 작성되어 있음.
- 공용 레이어/어댑터 (MVP 기준)
  - `packages/core/src/domain`: 문서/폴더/설교 타입과 유틸을 통합. 웹·RN 공용 도메인 진입점은 `import { ... } from 'core'`.
  - `packages/core/src/services`: `DocumentService`, `FolderService` 인터페이스 정의. 각 메서드는 tRPC/Supabase 호출 규약을 명시.
  - 웹 구현 훅: `lib/api/services/useDocumentService.ts`, `useFolderService.ts`가 tRPC `useUtils`/`useMutation`을 감싸 공용 인터페이스를 구현.
  - 플랫폼 포트: `ports/{auth,toast,storage,share,clock,logger,router}.ts` 등 추상화가 존재하며, 웹 어댑터는 `adapters/web/*`에서 구현(`toastPort`는 `lib/toast.ts`에서 export).
  - 적용 예시: 로그인 폼은 `webAuthPort.signInWithPassword`를 사용하고, 문서/폴더 화면은 `toastPort`·공용 서비스 훅으로 교체됨.

## 흔한 작업 절차(체크리스트)
- tRPC 엔드포인트 추가
  1) `server/api/routers/feature.ts`에 라우터 추가 + Zod 스키마
  2) `server/api/root.ts`에 등록
  3) 클라이언트에서 `utils/api.ts`의 `api.feature.xxx.useQuery()` 사용
- Prisma 모델 추가
  1) `prisma/schema.prisma` 수정 → generate/migrate
  2) 필요한 경우 tRPC/페이지에서 사용
- 에디터 확장 추가
  1) `components/editor/extensions`에 노드/마크 구현
  2) `HolyEditor.tsx`의 `extensions` 배열에 등록
- 마이그레이션 도우미
  - 로컬 저장소 → DB 이전은 `utils/migration.ts`, `app/documents/page.tsx`의 플로우 참고(자동 이전 로직 포함).

## 품질/검증
- 개발 서버 부팅 확인: `/`, `/documents`, `/editor/new` 진입 확인
- tRPC 라우트: `/api/trpc` 요청 성공/에러 포맷 확인
- Prisma: 마이그레이션/스튜디오 연결 확인
- 포맷/스타일: Tailwind 4 규칙과 기존 컴포넌트 패턴 준수

## 알려진 주의사항
- Supabase 인증 미완성: `server/api/trpc.ts`의 `createTRPCContext`에 사용자 주입 TODO
- 환경변수 예시에 Supabase URL/Anon Key 항목이 빠져 있음(위 ‘빠른 시작’ 참고 후 `.env.example` 보강 필요)
- `utils/api.ts`와 `app/providers.tsx` 모두 `createTRPCReact`를 정의합니다. Provider는 `app/providers.tsx`의 `api.Provider`, 컴포넌트 훅은 `utils/api.ts`의 `api` 사용을 권장합니다.
- 저장소에 테스트 스크립트(`check-holy-tables.js`, `test-supabase-connection.js`)가 포함되어 있으며, 연결 문자열 등 민감정보가 있을 수 있으니 외부 노출 금지.
- 일부 텍스트가 인코딩 문제로 깨져 보일 수 있습니다. 사용자 UI 문구를 수정할 땐 실제 의미를 확인 후 교정하세요.

## 커뮤니케이션 규칙(에이전트 응답 스타일)
- 톤: 간결·직설·친절. 불필요한 서술 금지.
- 프리앰블: 연속 커맨드/패치를 묶어 1–2문장으로 예고.
- 진행 공유: 오래 걸리는 작업 전·후 1문장 상태 업데이트.
- 파일 참조: `path:line` 형식으로 짧게, 필요한 지점만.
- 비밀값·내부 URL은 마스킹 후 언급.

이 가이드를 기준으로 작업 범위를 명확히 합의하고, 작은 단위로 안전하게 변경해 주세요.

## 트러블슈팅

### 이미지 업로드 실패 (Supabase Storage + RLS)
- "new row violates row-level security policy" 에러
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

## 푸시 전 검사(Checklist)

다음 검사를 통과하지 못하면 푸시하지 않습니다. Vercel 빌드 실패(예: `react-hooks/rules-of-hooks`)를 사전에 차단합니다.

1) TypeScript 타입/문법 검사
```bash
npx tsc --noEmit
```
- 0 에러여야 합니다.

2) ESLint 검사(Next/React/TS 규칙 포함)
```bash
npm run lint
# 또는 경고까지 실패 처리
npx eslint . --ext ts,tsx,js,jsx --max-warnings=0
```
- 에러가 있으면 `npm run lint:fix`로 자동 수정 후 수동 보정.
- 중요 규칙: `react-hooks/rules-of-hooks` 위반은 반드시 수정(조건부 훅 호출, 훅 순서 변경 금지).

권장: 자동화(선택)
```bash
npx husky-init && npm i -D husky
echo 'npm run lint && npx tsc --noEmit' > .husky/pre-push
chmod +x .husky/pre-push
```
- 푸시 직전 자동으로 린트/타입 검사를 수행합니다.
