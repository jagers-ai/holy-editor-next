---
date: "YYYY-MM-DD"
project: "BREAD"
session:
  start: "YYYY-MM-DDThh:mm:ss+09:00"
  end: "YYYY-MM-DDThh:mm:ss+09:00"
  duration_min: 0
env:
  branch: "main"
  node: "18.x"
  runtime: "Vercel"
  region: "ap-northeast-2"
commit_range: ["<fromSHA>", "<toSHA>"]
owner: "jinsan"
# 선택: 관측성(모니터링) 메타
observability:
  sentry: false   # true면 아래 release/샘플링 채우기
  release: "<VERCEL_GIT_COMMIT_SHA 또는 태그>"
  traces: 0.1
  profiles: 0.0
---

# 🧩 코딩 회고 보고서 템플릿 (AI 자동작성 친화형)

> 이 템플릿은 사람이 읽기 쉽고 AI가 안정적으로 파싱할 수 있도록 설계되었습니다. 실제 값으로 채우기 전, 아래 지침과 체크리스트를 먼저 확인하세요.

## ✅ 작성 지침 (반드시 준수)
- 민감정보: 실제 비밀번호·토큰·접속 URL 금지. `.env` 키 이름만 기술(예: `DATABASE_URL`, `DIRECT_URL`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`). 노출 시 즉시 키 회전 후 문서 수정.
- 머신가독성: 문서 상단 YAML front matter, 하단 AI JSON 블록을 반드시 포함. JSON 블록은 `<!-- AI-LOG:START -->`와 `<!-- AI-LOG:END -->` 경계 주석으로 감싸기.
- 추적성: 커밋 범위, 관련 파일 목록, 실행 명령어, 이슈/PR 링크를 목록화. 가능하면 `git log --oneline --stat <from>..<to>` 요약 첨부.
- 시간/환경: 시작/종료 시각(ISO8601+TZ), 브랜치, 런타임/배포 타깃, 리전 등 실행 맥락 기입.
- 증거 우선: 수치·파일 변경량·커밋·로그 등 근거 중심. 내러티브는 간결하게.
- 일관 포맷: 섹션 제목/항목 키워드 유지. 수치 단위(°C, 분, g 등) 명시.
- 모니터링(선택): Sentry 등 통합 시 릴리즈/소스맵/샘플링/PII/터널 설정을 문서화. 값은 절대 기입하지 말고 키명만 기술.

## 🧪 최소 체크리스트
- [ ] YAML front matter 채움(날짜/세션/환경/커밋 범위)
- [ ] 비밀정보 미포함 확인(접속 문자열·토큰·이메일 등)
- [ ] 커밋·파일·명령어·지표를 목록화
- [ ] 하단 AI JSON 블록 채움 및 경계 주석 포함
- [ ] `git log --oneline --stat` 요약 또는 링크 첨부
- [ ] (관측성) release 식별자 기입 및 소스맵 업로드 여부 기록
- [ ] (관측성) 샘플링 전략(값/라우트/환경별)과 복구 계획 명시
- [ ] (관측성) PII/노이즈 필터링 및 터널 경로 설정 여부 기입

---

# 🍞 BREAD 개발 회고 보고서

## 📋 세션 개요
- 프로젝트: BREAD (베이커리 원가 계산 서비스)
- 작업 기간: YYYY-MM-DD (총 N시간)
- 주요 목표: <요약 목표>
- 총 커밋: <N회 배포 또는 from..to 범위>
- 실행 환경: 브랜치 `<branch>`, 배포 `<runtime>`, 리전 `<region>`

## 🔄 작업 단계별 상세 분석

### Phase 1: <제목>
작업 시간: 약 N분 | 커밋: `<shortSHA>`

#### 🎯 작업 내용
1. <핵심 변경 1>
2. <핵심 변경 2>
3. <핵심 변경 3>

```code
// 관련 코드/스키마/컴포넌트 스니펫(민감정보 금지)
```

#### ❌ 에러/리스크(선택)
- 증상: <요약>
- 원인: <요약>
- 해결: <요약> (.env 키명만 표기)
- 예방: <요약>

---

### Phase 2: <제목>
작업 시간: 약 N분 | 커밋: `<shortSHA>`

#### 🎯 작업 내용
- <변경/추가/삭제 요약>

```bash
# 사용 명령어(환경변수는 키명만, 샘플 값 금지)
npx prisma migrate dev --name <migration_name>
```

#### 🔍 에러 방지 전략(선택)
- 단계별 검증: DB → 백엔드 → 프론트엔드
- 기존 데이터 보호: optional 필드 우선

---

### Phase 3: <제목>
작업 시간: 약 N분 | 커밋: `<shortSHA>`

#### 🎯 작업 내용
- <UI/로직/스키마 설계 이유와 효과>

```code
// 레이아웃/컴포넌트 변경 요약(단위/라벨 일관성 강조)
```

#### 💡 설계 결정 사항
- <결정 1> — 근거: <이유>
- <결정 2> — 근거: <이유>

---

## 🐛 주요 에러 및 해결 전략

### 1) <에러 코드 또는 요약>
```text
<에러 메시지(민감정보 제거)>
```
- 원인: <요약>
- 해결: <요약>(`.env` 키명만 기입)
- 학습: <요약>
- 예방: <스크립트/체크리스트 언급>

### 2) <에러 코드 또는 요약>
- <동일 형식으로 기술>

---

## 📊 성과 지표
```yaml
배포 횟수: <N회>
평균 작업 시간: <N분/단계>
에러 복구 시간: <N분>
테스트: <종류/범위>
```

```yaml
변경 통계:
  Phase 1: <files changed>, <insertions(+), deletions(-)>
  Phase 2: <...>
  Phase 3: <...>
총합: <파일 수>, <추가 줄>, <삭제 줄>
마이그레이션: <N개>
빌드 성공률: <퍼센트>
```

### 사용자 만족도(선택)
- ✅ <피드백 반영 항목>
- ✅ <UX 개선 항목>

---

## 🎓 핵심 학습 사항
- MVP 철학: 빠르되 제대로 — <사례>
- 데이터베이스 유연성: optional 필드/점진적 스키마 — <사례>
- 사용자 중심 개발: 요구사항과 로직의 교차점 — <사례>
- 에러 처리 패턴: 환경변수/검색/단계 검증 — <사례>

---

## 🔮 향후 개선 방향

### 1. 기술적 부채
- [ ] <작업 항목>
- [ ] <작업 항목>

### 2. 사용자 경험 개선
- [ ] <작업 항목>

### 3. 비즈니스 로직 확장
- [ ] <작업 항목>

---

## 💭 회고 및 개선점

### 잘한 점
- <요약>

### 개선할 점
- <요약>

### 다음 개발 시 적용할 점
```bash
# 예: 환경변수 검증 스크립트 (샘플, 실제 값 입력 금지)
#!/bin/bash
if [[ -z "$DATABASE_URL" || -z "$DIRECT_URL" ]]; then
  echo "❌ 필수 환경변수가 설정되지 않았습니다"; exit 1
fi
echo "✅ 환경변수 검증 완료"
```

---

## 📈 최종 결과 및 성과

### 기술적 성과
```yaml
데이터베이스: <변경 요약>
백엔드: <변경 요약>
프론트엔드: <변경 요약>
```

### 비즈니스 성과
- <핵심 가치 달성 요약>

### 개발 프로세스 성과(선택)
```yaml
개발 속도: <별/점수>
사용자 만족도: <별/점수>
코드 품질: <별/점수>
안정성: <별/점수>
확장성: <별/점수>
```

---

## 🧾 증거(Evidence)
- 커밋 범위: `<fromSHA>`..`<toSHA>`
- 관련 이슈/PR: <링크 목록>
- 관련 파일: <상대 경로 목록>
- (관측성) 릴리즈 식별자: `<release-id>` / 소스맵 업로드: `<예/아니오>`

```bash
# 선택: 증거 로그 요약 (붙여넣기)
git log --oneline --stat <fromSHA>..<toSHA>
```

---

## 🔧 모니터링 통합 가이드(선택)
> Sentry 등 오류/성능 모니터링을 통합할 때 아래 체크를 참고하세요(키명만 기입, 값 금지).

### 환경변수 키 목록(예시)
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`(CI 전용 최소 권한), `SENTRY_ORG`, `SENTRY_PROJECT`
- `VERCEL_GIT_COMMIT_SHA`(release 식별자), `NODE_ENV`, `NEXT_PUBLIC_*` 키

### next.config.ts 래퍼 예시
```ts
import { withSentryConfig } from '@sentry/nextjs';
const nextConfig = { /* ... */ };

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  tunnelRoute: '/monitoring', // Adblock 회피용 전송 터널(선택)
});
```

### sentry.*.config.ts 예시(샘플링/PII 필터)
```ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1, // 선택: 프로파일링
  tracesSampler: ctx => {
    if (ctx.request?.url?.includes('/api/health')) return 0; // 노이즈 제외
    if (ctx.request?.url?.includes('/api/calc')) return 0.3; // 핵심 경로 상향
    return process.env.NODE_ENV === 'production' ? 0.1 : 0.0;
  },
  beforeSend(event) {
    // 알려진 노이즈/PII 제거 예시
    const t = event?.exception?.values?.[0]?.type || '';
    if (/ResizeObserver|Non-Error exception captured/i.test(t)) return null;
    return event;
  },
});
```

### CI 릴리즈/소스맵 업로드(예시)
```bash
# SENTRY_AUTH_TOKEN은 CI 비밀변수로만 저장, 레포 금지
export SENTRY_AUTH_TOKEN=***
export SENTRY_ORG=***
export SENTRY_PROJECT=***
export RELEASE="$VERCEL_GIT_COMMIT_SHA"

npx sentry-cli releases new "$RELEASE"
npx sentry-cli releases set-commits "$RELEASE" --auto
npx sentry-cli sourcemaps upload --release "$RELEASE" .next/static/js
npx sentry-cli releases finalize "$RELEASE"
```

---

## 🤖 AI 파싱용 JSON 블록
<!-- AI-LOG:START -->
```json
{
  "tasks": [
    {
      "id": "T-XXXX-001",
      "title": "<작업 제목>",
      "type": "db|backend|frontend|infra|docs",
      "commits": ["<shortSHA>"],
      "files": ["<path/to/file1>", "<path/to/file2>"] ,
      "decisions": ["<핵심 결정 요약>"] ,
      "metrics": {"files_changed": 0, "insertions": 0, "deletions": 0},
      "status": "done|wip|blocked",
      "time_min": 0
    }
  ],
  "errors": [
    {
      "code": "<에러코드 또는 요약>",
      "summary": "<요약>",
      "resolution": "<해결>",
      "prevent": "<예방>"
    }
  ],
  "commands": [
    {"cmd": "<실행 명령어>", "note": "<비고>"}
  ],
  "risks": ["<리스크1>", "<리스크2>"],
  "next_actions": [
    {"title": "<다음 액션>", "owner": "jinsan"}
  ],
  "labels": ["mvp", "db", "frontend", "ux"],
  "links": {
    "issues": ["<url>"],
    "pr": ["<url>"],
    "docs": ["/docs/<this-file>.md"]
  },
  "observability": {
    "sentry": {
      "enabled": false,
      "release": "<release-id>",
      "tracesSampleRate": 0.1,
      "profilesSampleRate": 0.0,
      "tunnelRoute": "/monitoring"
    }
  }
}
```
<!-- AI-LOG:END -->

---

*작성자: <이름 또는 팀>*  
*보고서 작성일: YYYY-MM-DD*  
*프로젝트: BREAD*

