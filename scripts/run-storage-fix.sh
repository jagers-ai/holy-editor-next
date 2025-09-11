#!/bin/bash

# 이미지 업로드 버그 수정 스크립트
# Supabase Storage RLS 정책 추가

echo "🔧 Supabase Storage RLS 정책 수정 시작..."

# .env.local 파일에서 DIRECT_URL 읽기
if [ -f .env.local ]; then
    export $(grep DIRECT_URL .env.local | xargs)
else
    echo "❌ .env.local 파일을 찾을 수 없습니다."
    echo "📝 Supabase Dashboard에서 직접 실행해주세요:"
    echo "   https://supabase.com/dashboard/project/cpujpqxwrcrzdhiiyucp/sql/new"
    exit 1
fi

if [ -z "$DIRECT_URL" ]; then
    echo "❌ DIRECT_URL이 설정되지 않았습니다."
    echo "📝 .env.local 파일에 DIRECT_URL을 추가해주세요."
    exit 1
fi

# psql 설치 확인
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql이 설치되지 않았습니다."
    echo "📦 설치 방법:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   macOS: brew install postgresql"
    echo ""
    echo "또는 Supabase Dashboard에서 직접 실행하세요."
    exit 1
fi

# SQL 실행
echo "📤 RLS 정책 적용 중..."
psql "$DIRECT_URL" -f scripts/fix-storage-rls-policies.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS 정책이 성공적으로 적용되었습니다!"
    echo ""
    echo "🧪 테스트 방법:"
    echo "1. 에디터 페이지 접속: http://localhost:3000/editor/new"
    echo "2. 카메라 버튼 클릭"
    echo "3. 이미지 업로드 테스트"
else
    echo "❌ RLS 정책 적용 실패"
    echo "📝 Supabase Dashboard에서 직접 실행해주세요:"
    echo "   https://supabase.com/dashboard/project/cpujpqxwrcrzdhiiyucp/sql/new"
fi