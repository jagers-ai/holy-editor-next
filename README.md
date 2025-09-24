# ⛪ 홀리해빗 - 나만의 AI 신앙생활 파트너

<img width="1200" alt="Holy Habit Banner" src="https://via.placeholder.com/1200x300/4A5568/FFFFFF?text=Holy+Habit+-+AI+Faith+Companion">

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black)](https://holy-editor-next.vercel.app)
[![Last Update](https://img.shields.io/badge/last%20update-2025.01.09-blue)](https://github.com/jagers-ai/holy-editor-next)

> Note: Reasoning Summary(생각/사고 요약)는 한국어로 강제됩니다. 자세한 정책은 [instruction.md](./instruction.md)와 [agent.md](./agent.md)를 확인하세요.

## 언어/Reasoning 정책
- Reasoning Summary는 한국어로 강제합니다.
- 내부 추론 원문(Chain‑of‑Thought)은 공유하지 않으며, 결과 중심의 한국어 요약만 제공합니다.
- 코드/명령어/파일 경로/로그는 원문 그대로 표기하되, 바로 아래 한 줄 한국어 설명을 덧붙입니다.
- 사용자가 “영어로 답해”라고 명시 지시한 해당 턴에서만 영어를 허용합니다.

## 📖 소개

홀리해빗은 설교문이나 신앙 노트를 작성할 때 성경 구절을 빠르게 삽입하고 AI 도우미와 함께 관리할 수 있는 웹 기반 에디터입니다.

### ✨ 주요 기능

- **📝 리치 텍스트 에디팅** - Tiptap 3 기반의 강력한 에디터
- **📖 성경 구절 삽입** - 간편한 UI로 성경 구절 검색 및 삽입
- **💾 자동 저장** - 작성 중인 문서를 자동으로 저장
- **📱 반응형 디자인** - 모바일, 태블릿, 데스크톱 모두 지원
- **🎨 아름다운 UI** - Radix UI와 Tailwind CSS로 구현된 모던한 인터페이스

## 🚀 빠른 시작

### 필요 사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/holy-editor-next.git
cd holy-editor-next

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

## 🏗️ 배포(Vercel) — Supabase 연결 주의사항

Vercel의 서버리스 런타임에서는 Supabase(Postgres)와 연결 시 Connection Pooler(PgBouncer)를 사용해야 합니다. 잘못 설정하면 Prisma가 `prepared statement "s1" already exists (42P05)` 오류를 내고 인증/DB 요청이 모두 실패할 수 있습니다.

- Production 환경 변수 설정
  - `DATABASE_URL`: Pooler 포트 `6543` + `?pgbouncer=true` 필수
    - 예: `postgresql://postgres:******@[project-id].supabase.co:6543/postgres?pgbouncer=true`
    - (옵션) 드물게 연결 난립 시 `&connection_limit=1` 추가
  - `DIRECT_URL`: 기본 포트 `5432` (마이그레이션 등 직연결용)
    - 예: `postgresql://postgres:******@[project-id].supabase.co:5432/postgres`

- 왜 필요한가?
  - 서버리스는 연결이 자주 생성/해제됩니다. Pooler 없이 5432로 연결하면 준비된 쿼리/세션이 꼬여 `prepared statement` 에러가 발생합니다.

- 체크리스트
  - 배포 후 `/documents`에서 목록/저장이 정상인지 확인
  - Vercel 로그에 `42P05`가 보이면 `DATABASE_URL`을 재확인하세요

## 🗂️ Supabase Storage 설정(이미지 업로드)

에디터의 이미지는 Supabase Storage에 업로드되고, 본문엔 URL이 삽입됩니다. 다음을 설정하세요.

- 버킷 생성
  - 이름: `sermon-images`
  - Public: 읽기 허용(공유 페이지에서 바로 보이도록)

- 정책(Policies)
  - Select(읽기): 모든 사용자 허용 — 버킷 `sermon-images`
  - Insert(업로드): 인증 사용자 허용 — 버킷 `sermon-images`
    - UI 템플릿 “Insert objects” → `authenticated` 대상으로 생성하면 충분합니다.
  - Update/Delete는 필요 시 제한(권장: 소유자만)

- 업로드 경로
  - `/{userId}/{docId}/{timestamp-rand}.webp` 구조로 저장됩니다.

- 문제 해결
  - 버킷이 없으면 업로드 실패: “Storage 버킷 "sermon-images"을(를) 찾을 수 없습니다.”
  - 권한/정책 문제면: “Storage 업로드 권한이 없습니다(정책/로그인 확인).”

## 🛠️ 기술 스택

### Core
- **[Next.js 15](https://nextjs.org/)** - React 프레임워크 (App Router)
- **[TypeScript](https://www.typescriptlang.org/)** - 타입 안정성
- **[Tiptap 3](https://tiptap.dev/)** - 확장 가능한 리치 텍스트 에디터

### UI/UX
- **[Tailwind CSS 4](https://tailwindcss.com/)** - 유틸리티 우선 CSS
- **[Radix UI](https://www.radix-ui.com/)** - 접근성이 뛰어난 UI 컴포넌트
- **[Lucide Icons](https://lucide.dev/)** - 아름다운 오픈소스 아이콘

### State & Data
- **[TanStack Query](https://tanstack.com/query/)** - 서버 상태 관리
- **[React Hook Form](https://react-hook-form.com/)** - 폼 관리
- **[Zod](https://zod.dev/)** - 스키마 검증

## 📁 프로젝트 구조

```
holy-editor-next/
├── app/                    # Next.js App Router
│   ├── editor/[id]/       # 에디터 페이지
│   ├── documents/         # 문서 목록 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/
│   ├── editor/            # 에디터 관련 컴포넌트
│   │   ├── HolyEditor.tsx
│   │   ├── Toolbar.tsx
│   │   └── extensions/   # Tiptap 확장
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/
│   ├── bible/           # 성경 관련 유틸리티
│   └── utils.ts         # 공통 유틸리티
└── public/              # 정적 파일
```

## 🎯 사용 방법

### 새 문서 작성

1. 홈페이지에서 "새 문서 작성" 버튼 클릭
2. 제목과 내용 입력
3. 툴바의 📖 버튼으로 성경 구절 삽입
4. 자동으로 저장됨

### 성경 구절 삽입

1. 에디터 툴바의 📖 버튼 클릭
2. 성경 책, 장, 절 선택
3. "삽입" 버튼으로 에디터에 추가

### 문서 관리

- `/documents` 페이지에서 모든 문서 확인
- 각 문서 클릭하여 편집
- 삭제 버튼으로 문서 제거

## 🤝 기여하기

기여는 언제나 환영합니다! 다음 과정을 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Tiptap](https://tiptap.dev/) - 훌륭한 에디터 프레임워크
- [Radix UI](https://www.radix-ui.com/) - 아름다운 UI 컴포넌트
- [Vercel](https://vercel.com/) - Next.js와 호스팅 지원

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

Built with ❤️ for the Glory of God
