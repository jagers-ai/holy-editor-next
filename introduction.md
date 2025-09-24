# 홀리해빗 Next – 소개 및 최근 구조 개편 메모

## 프로젝트 한눈에 보기
- **플랫폼**: Next.js 15(App Router) 기반 웹앱 + Expo RN 워크스페이스(`apps/mobile`).
- **주요 스택**: React 19, TypeScript, tRPC, Prisma(PostgreSQL/Supabase), Tailwind v4, Tiptap 3.
- **모노레포 구성**: `app/`(웹 라우팅), `components/`, `packages/core`(공용 도메인), `server/`(tRPC/Prisma), `apps/mobile/`(Expo), `lib/`(도메인 유틸·Supabase 래퍼), `ports/` + `adapters/`(플랫폼 어댑터).

## 2025-09-18 기준 구조화 업데이트
- **공용 도메인 정리**: 문서/폴더/설교 타입을 `packages/core/src/domain`에 통합하고, 웹은 `import { … } from 'core'`로 참조.
- **서비스 인터페이스 초안**: `packages/core/src/services/{document,folder}.ts`에서 tRPC/Supabase 호출 규약(목록, 단건, 리비전, 폴더 이동 등)을 정의.
- **웹 서비스 훅**: `lib/api/services/useDocumentService.ts`, `useFolderService.ts`가 `api.useUtils()`와 `useMutation`을 감싼 공용 레이어 구현. 문서/폴더 페이지가 새 훅을 채택.
- **플랫폼 어댑터**: `ports/toast.ts`, `ports/auth.ts`를 추가하고, 웹 구현(`adapters/web/auth.ts`, `lib/toast.ts`의 `toastPort`)을 제공. 로그인 폼과 문서/폴더 화면 일부가 새 포트를 사용.
- **문서화**: `docs/architecture/mvp-shared-plan.md`에 진행 현황과 RN 전환 체크리스트를 기록.

## RN 전환을 위한 현재 토대
1. `core` 패키지가 도메인/서비스의 단일 진입점으로 작동.
2. 공용 서비스 인터페이스를 통해 tRPC 호출을 캡슐화 → RN 클라이언트 구현만 추가하면 동일 포트를 재사용 가능.
3. 토스트·인증 포트가 플랫폼별 어댑터 패턴을 시작. Storage, Navigation 등은 후속 단계 TODO.

## 다음 단계 제안 (MVP 이후)
1. **Storage 업로드 어댑터화**: `lib/storage/uploadImage.ts`를 포트화해 RN 업로더를 병행.
2. **RN 전용 서비스 어댑터**: `createTRPCProxyClient` + Expo `fetch`를 활용한 RN Document/Folder 서비스 PoC.
3. **디자인 토큰 공유**: Tailwind 테마 → RN 스타일(예: nativewind) 매핑 규칙 작성.
4. **테스트 보강**: `packages/core` 도메인/서비스 함수에 Vitest 스모크 테스트 추가.

## 참고 문서
- `docs/architecture/mvp-shared-plan.md`: 공용 레이어 계획, 체크리스트, 이행 현황
- `agent.md`: 에이전트 작업 규칙 및 아키텍처 가이드
- `instructions.md`: Reasoning/응답 정책 기본 규약

앞으로도 모든 리팩토링/모듈화는 `core` 패키지와 포트/어댑터 계층을 중심으로 진행하여, 웹·RN 양쪽에서 재사용 가능한 구조를 유지합니다.
