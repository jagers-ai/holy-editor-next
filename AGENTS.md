# Repository Guidelines

## 언어/Reasoning 정책
- Reasoning Summary(생각/사고 요약)는 한국어로 강제합니다.
- 내부 추론 원문(Chain‑of‑Thought)은 공유하지 말고, 결과 중심의 한국어 요약으로만 제시합니다.
- 코드/명령어/파일 경로/로그는 원문 그대로 표기 가능하되, 바로 아래 한 줄 한국어 설명을 덧붙입니다.
- 사용자가 “영어로 답해”라고 명시 지시한 해당 턴에서만 영어 허용합니다.

## Project Structure & Module Organization
- `app/`: Next.js App Router (페이지, `layout.tsx`, `app/api/*`).
- `components/`: UI·에디터·레이아웃 컴포넌트(작게 분리, 재사용 우선).
- `lib/`: 공용 유틸과 서비스(`logger`, `supabase`, `toast`).
- `server/`: 서버 전용 코드(`db.ts`, tRPC 라우터는 `server/api`).
- `prisma/`: `schema.prisma`, `migrations/`, `seed.ts`.
- 기타: `public/` 정적, `hooks/`, `utils/`, `contexts/`, `types/`, `docs/`, `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` — 개발 서버(Turbopack) 실행: http://localhost:3000
- `npm run build` — `prisma generate` 후 Next 빌드.
- `npm run start` — 프로덕션 서버 실행.
- `npm run lint` / `lint:fix` — ESLint 점검 / 자동 수정.
- `npm run db:migrate` — Prisma 마이그레이션 적용(개발용).
- `npm run db:seed` / `db:studio` — 시드 실행 / Prisma Studio.

## Coding Style & Naming Conventions
- TypeScript 사용. 들여쓰기 2 스페이스(`.editorconfig`).
- 파일명: 일반 `kebab-case`, React 컴포넌트 `PascalCase`, 훅 `useXxx`.
- 기능 단위 콜로케이션 권장. 불필요한 `any` 지양, 미사용 변수는 `_` 접두 허용.
- ESLint 적용(React Hooks 규칙 엄격). 클라이언트 컴포넌트는 상단에 `"use client"` 명시.

## Testing Guidelines
- 현재 테스트 러너 미구성. 도입 권장: Vitest + React Testing Library, E2E는 Playwright.
- 파일 위치: 소스 인접 `*.test.ts(x)` 또는 `__tests__/`.
- 커버리지 기준은 도입 시 결정(핵심 유틸·훅 우선 커버).

## Commit & Pull Request Guidelines
- 커밋: Conventional Commits 권장(`feat|fix|docs|refactor|chore` 등, 이모지 선택적).
- 제목은 명령조(~50자 내), 본문에 “왜/어떻게”를 간략히 기술.
- PR: 목적·변경 요약, 관련 이슈 링크, UI 변경은 스크린샷, 테스트 방법/리스크/롤백 전략 포함.

## Security & Configuration Tips
- 비밀키는 커밋 금지. `cp .env.example .env.local` 후 값 설정(`DATABASE_URL`, `SUPABASE_*`, `SENTRY_DSN`).
- Prisma 스키마 불일치 의심 시 `node check-holy-tables.js` 확인.
- 데이터 마이그레이션은 `./migrate-to-holy-editor.sh` 사용 전 스크립트 검토.
- 클라이언트 번들에 서버 전용 코드(`server/*`, DB 접근) 임포트 금지.
