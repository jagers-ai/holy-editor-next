#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}🚀 Holy Editor 데이터베이스 마이그레이션${NC}"
echo -e "${GREEN}==================================================${NC}"

# 환경변수 설정
export DATABASE_URL="postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

echo -e "${YELLOW}⚠️  경고: 이 작업은 기존 BREAD 테이블을 모두 삭제합니다!${NC}"
echo -e "${YELLOW}현재 테이블: ingredients, recipes, recipe_ingredients${NC}"
echo -n "계속하시겠습니까? (y/N): "
read -r response

if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo -e "${RED}❌ 마이그레이션 취소됨${NC}"
    exit 1
fi

echo -e "\n${GREEN}1️⃣ Prisma Client 생성...${NC}"
npx prisma generate

echo -e "\n${GREEN}2️⃣ 기존 마이그레이션 제거...${NC}"
rm -rf prisma/migrations

echo -e "\n${GREEN}3️⃣ 새 마이그레이션 생성...${NC}"
npx prisma migrate dev --name init-holy-editor --create-only

echo -e "\n${GREEN}4️⃣ 마이그레이션 적용...${NC}"
npx prisma migrate deploy

echo -e "\n${GREEN}5️⃣ Prisma Client 재생성...${NC}"
npx prisma generate

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}✅ 마이그레이션 완료!${NC}"
echo -e "${GREEN}==================================================${NC}"

echo -e "\n📋 생성된 테이블 확인:"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    const tables = await prisma.\$queryRaw\`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    \`;
    console.log('현재 테이블:', tables.map(t => t.tablename).join(', '));
  } catch (error) {
    console.error('테이블 확인 실패:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

checkTables();
"