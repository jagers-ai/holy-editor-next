# ⛪ Holy Editor - 성경 구절 삽입 에디터

<img width="1200" alt="Holy Editor Banner" src="https://via.placeholder.com/1200x300/4A5568/FFFFFF?text=Holy+Editor+-+Bible+Verse+Editor">

## 📖 소개

Holy Editor는 설교문이나 성경 공부 자료를 작성할 때 성경 구절을 쉽게 삽입하고 관리할 수 있는 웹 기반 에디터입니다.

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