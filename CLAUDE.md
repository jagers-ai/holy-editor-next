# 🍞 BREAD 프로젝트 개발 가이드

## 프로젝트 개요
- **프로젝트명**: BREAD (베이킹 레시피 원가 계산 시스템)
- **기술 스택**: Next.js 15, Prisma, PostgreSQL (Supabase), tRPC
- **주요 기능**: 재료 관리, 레시피 관리, 원가 계산, 섹션별 그룹화

---

## ⚠️ 크리티컬 이슈: Prisma 스키마 변경 시 필수 작업

### 문제 상황
Prisma 스키마 변경 후 마이그레이션만 실행하고 Client를 재생성하지 않으면:
- `Unknown argument` 에러 발생
- API 500 에러로 앱 작동 불가  
- TypeScript 타입 불일치

### 필수 실행 순서 ⭐
```bash
# 1. DB 마이그레이션 (스키마 변경 시)
DATABASE_URL="postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" \
DIRECT_URL="postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
npx prisma migrate dev --name your-migration-name

# 2. Prisma Client 재생성 (필수!)
npx prisma generate

# 3. Next.js 캐시 정리
rm -rf .next

# 4. 개발 서버 재시작
npm run dev
```

### 자주 발생하는 실수
- ❌ 마이그레이션만 실행하고 generate 누락
- ❌ 서버 재시작 없이 계속 개발
- ❌ .next 캐시가 남아있어 이전 스키마 사용

### 빠른 복구 스크립트
```bash
# 한 번에 모두 실행
npx prisma generate && rm -rf .next && npm run dev
```

### 증상별 해결책
| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| `Unknown argument 'fieldName'` | Prisma Client 미갱신 | `npx prisma generate` |
| API 500 에러 | 서버 캐시 | 서버 재시작 |
| 타입 에러 | TypeScript 캐시 | `.next` 폴더 삭제 |

---

## 🔧 개발 환경 설정

### 환경 변수 (.env.local)
```env
DATABASE_URL="postgresql://..."  # Supabase pooler URL
DIRECT_URL="postgresql://..."    # Supabase direct URL
```

### 로컬 개발 서버
```bash
npm run dev  # 기본 포트 3000, 사용 중이면 3002
```

---

## 📁 프로젝트 구조

```
bread/
├── app/                # Next.js App Router
│   ├── ingredients/    # 재료 관리 페이지
│   └── recipes/       # 레시피 관리 페이지
├── server/
│   └── api/
│       └── routers/   # tRPC 라우터
├── prisma/
│   └── schema.prisma  # DB 스키마
└── components/        # UI 컴포넌트
```

---

## 🚀 주요 기능

### 1. 재료 관리
- 무게/구매가격 입력으로 단가 자동 계산
- 실시간 단가 업데이트

### 2. 레시피 관리
- 섹션별 재료 그룹화 (반죽, 소스, 토핑 등)
- 섹션별 원가 계산
- 총 원가 및 마진율 자동 계산

### 3. 원가 계산
- 개당 원가 자동 계산
- 판매가 대비 마진율 표시
- 섹션별 원가 breakdown

---

## 📝 개발 시 주의사항

1. **DB 스키마 변경 시**: 위의 필수 작업 순서 준수
2. **Decimal 타입**: 금액 계산 시 Prisma Decimal 사용
3. **환경 변수**: 마이그레이션 시 DATABASE_URL과 DIRECT_URL 모두 필요

---

## 🐛 트러블슈팅

### Prisma 관련
- 마이그레이션 실패: 환경 변수 확인
- Client 에러: `npx prisma generate` 실행

### Next.js 관련  
- 포트 충돌: 3000번 사용 중이면 자동으로 3002 사용
- 캐시 문제: `.next` 폴더 삭제

---

*최종 업데이트: 2025-01-27*