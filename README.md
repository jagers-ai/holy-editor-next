# 🍞 BREAD - 베이커리 원가 계산기

**B**asic **R**ecipe **E**conomic **A**nalysis **D**ashboard

베이커리 사업주를 위한 정확한 원가 계산 서비스 MVP

## 🚀 핵심 기능

1. **재료 관리** - 재료별 단가 정보 CRUD
2. **레시피 관리** - 레시피와 필요 재료 등록
3. **원가 계산** - 생산 수량에 따른 정확한 원가 계산

## 🛠️ 기술 스택

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: tRPC + Prisma
- **Database**: Supabase (PostgreSQL)
- **Monitoring**: Sentry + PostHog
- **Deployment**: Vercel

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
DATABASE_URL="your_supabase_pooled_url"
DIRECT_URL="your_supabase_direct_url"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

## 🚀 Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결 및 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서)
# 위의 6개 환경변수를 모두 설정

# 프로덕션 배포
vercel --prod
```

## 📝 주요 API 엔드포인트

- `/api/trpc` - tRPC 라우터
  - `ingredients.*` - 재료 CRUD
  - `recipes.*` - 레시피 CRUD
  - `calculator.calculate` - 원가 계산

## 🎯 MVP 수용 기준

✅ 재료 추가/수정/삭제 기능  
✅ 레시피 생성 및 재료 연결  
✅ 생산 수량별 원가 계산  
✅ Decimal 타입으로 정확한 금액 처리  
✅ 에러 모니터링 (Sentry)  
✅ 사용자 분석 (PostHog)  

## 📊 데이터베이스 스키마

```prisma
model Ingredient {
  id           String   @id @default(cuid())
  name         String
  unit         String
  pricePerUnit Decimal  @db.Decimal(10, 2)
  // ...
}

model Recipe {
  id         String   @id @default(cuid())
  name       String
  yieldCount Int      @default(1)
  // ...
}

model RecipeIngredient {
  recipeId     String
  ingredientId String
  quantity     Decimal  @db.Decimal(10, 2)
  // ...
}
```

## 🏁 MVP 완성

이 프로젝트는 **진짜 MVP** 철학으로 개발되었습니다:
- 최소 기능만 구현 (3개 핵심 페이지)
- 오버엔지니어링 없음
- 작동하는 제품 우선
- 나중에 개선 가능한 구조

---

Built with ❤️ for Bakery Owners