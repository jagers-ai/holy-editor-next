# MVP 공용 레이어 전환 준비 플랜

## 1. 목적과 범위
- **목표**: 웹 MVP 개발을 지연시키지 않으면서 RN 전환 시 재사용 가능한 최소 공용 레이어 토대를 마련한다.
- **범위**: 도메인 타입, 데이터 접근 규약, 플랫폼 추상화 포인트만 선제적으로 정의하고, UI/라우팅/에디터와 같은 웹 전용 구현은 현상 유지한다.

## 2. 자산 인벤토리 및 태깅
| 영역 | 대표 파일/폴더 | 현재 역할 | 태그 | 비고 |
| --- | --- | --- | --- | --- |
| 도메인 | `packages/core/src/domain/*`, `core` export | 설교 정보, 미리보기, 날짜 헬퍼 | **공용 이동** | 2단계에서 웹 코드 연결 완료 |
| API 유틸 | `lib/api/keys.ts`, `lib/api/options.ts`, `lib/api/prefetch.ts` | React Query 키, 옵션 | **공용 이동** | 키 생성 로직을 서비스 인터페이스에 맞춰 분리 필요 |
| Supabase/세션 | `lib/supabase/*`, `lib/api`, `server/api` | 인증, 데이터 패칭 | **추후 검토** | RN 구현 차이가 커서 서비스 인터페이스만 도입 예정 |
| 에디터 | `components/editor/*`, `lib/editor/*`, `contexts/EditorContext.tsx` | Tiptap 기반 UI+상태 | **웹 전용** | RN 전용 에디터가 달라질 가능성 높음 |
| Hooks | `hooks/useMobile.ts`, `hooks/useMediaQuery.ts`, 등 | 플랫폼 감지, 레이아웃 보정 | **웹 전용** | RN 이식 시 별도 구현 예정 |
| 서버 | `server/api/**`, `prisma/` | tRPC 라우터, Prisma 모델 | **공용 이동(인터페이스)** | 모듈화 후 패키지로 타입 공유 고려 |
| 모바일 앱 | `apps/mobile/**` | Expo RN MVP | **추후 검토** | Expo 구조 유지, 웹 변경 영향 없음 |

### 기타 참고 디렉터리
- `utils/`, `lib/utils.ts`: 범용 헬퍼. 실제 RN 사용 여부 확인 후 단계적으로 이동.
- `lib/logger.ts`, `lib/posthog.ts`: 로깅/분석. 플랫폼별 차이가 큼 → 어댑터 대상.

## 3. 의존성 분석 메모
- `npx madge`를 이용한 순환 의존 확인을 시도했으나 Expo 경로(`apps/mobile/app`) 해석 문제로 실패. Expo 전용 tsconfig가 별도로 필요하거나, `madge` 실행 시 `--ts-config` 대신 단순 `--extensions` 옵션만 사용하는 방식 검토 필요.
- 후속 단계에서 `madge` 설정을 분리(`madge.config.json`)하거나 모바일 디렉터리를 명시적으로 제외하는 스크립트 마련 예정.

## 4. 단계별 산출물 개요
1. **2단계** – `packages/core`에 문서·폴더·설교 타입 통합, Prisma 모델과 싱크 맞춘 타입 export.
2. **3단계** – 공용 서비스 인터페이스 도입 후 웹 구현이 인터페이스에 의존하도록 조정.
3. **4단계** – 인증/스토리지/토스트 어댑터 인터페이스와 웹 구현 작성.
4. **5단계** – 체크리스트 및 문서 업데이트(`docs/architecture`, `agent.md`, `introduction.md`).

## 5. 즉시 액션 아이템
- `packages/core` 구조 확장 설계 초안 작성.
- 공용 서비스 인터페이스 명명 규칙 합의(`DocumentService`, `FolderService` 등).
- 플랫폼 어댑터에 포함할 최소 기능 정의(인증 세션, 토스트, 로컬 스토리지).

## 6. 진행 현황 요약 (2025-09-18)
- 도메인 타입: `packages/core/src/domain`에 문서/폴더 타입을 통합하고 웹 코드는 `core` 패키지를 직접 참조.
- 서비스 인터페이스: `packages/core/src/services/{document,folder}.ts`에 tRPC/Supabase 호출 규약을 정의하고, 웹 레이어에서 `useDocumentService`·`useFolderService` 훅으로 구현.
- 플랫폼 어댑터: `ports/toast.ts`, `ports/auth.ts`에 공용 포트를 추가하고, `adapters/web/{auth,toast}`로 웹 구현을 제공. 로그인 폼 등 일부 화면에서 신규 어댑터 사용을 시작.

## 7. RN 전환 준비 체크리스트 (초안)
- [x] 공용 도메인 타입(`DocumentListEntry`, `FolderSummary`, `SermonInfo`)을 `core` 패키지에서 관리
- [x] 문서/폴더 서비스 인터페이스 초안 및 웹 구현 훅 작성
- [x] 토스트/인증 포트 정의 및 웹 어댑터 연결
- [ ] Supabase Storage 업로드 추상화(웹/RN 분리) 설계
- [ ] Expo 앱에서 `core` 패키지 참조 검증 및 타입 공유 경로 점검
- [ ] Document/Folder 서비스의 RN 클라이언트 어댑터 프로토타입 작성
- [ ] RN 전용 네비게이션/스토리지 포트 초안 수립
