#!/bin/bash

# 프론트엔드 테스트 스크립트

echo "=== 프론트엔드 테스트 시작 ==="

# 1. 빌드 확인
echo ""
echo "1. 빌드 확인..."
if [ -d ".next" ]; then
    echo "✓ .next 디렉토리 존재"
    if [ -f ".next/BUILD_ID" ]; then
        echo "✓ BUILD_ID 파일 존재: $(cat .next/BUILD_ID)"
    else
        echo "⚠ BUILD_ID 파일 없음"
    fi
    if [ -d ".next/standalone" ]; then
        echo "✓ standalone 빌드 존재"
    else
        echo "⚠ standalone 빌드 없음"
    fi
else
    echo "✗ .next 디렉토리 없음"
    exit 1
fi

# 2. 환경 변수 확인
echo ""
echo "2. 환경 변수 확인..."
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    echo "✓ NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
else
    echo "⚠ NEXT_PUBLIC_API_URL 설정되지 않음 (기본값: http://localhost:3001)"
fi

# 3. 의존성 확인
echo ""
echo "3. 의존성 확인..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules 디렉토리 존재"
    if [ -f "node_modules/.bin/next" ]; then
        echo "✓ next 명령어 존재"
    else
        echo "✗ next 명령어 없음"
        exit 1
    fi
else
    echo "✗ node_modules 디렉토리 없음"
    exit 1
fi

# 4. 주요 파일 확인
echo ""
echo "4. 주요 파일 확인..."
files=(
    "package.json"
    "next.config.js"
    "app/layout.tsx"
    "app/page.tsx"
    "components/ChatInterface.tsx"
    "lib/api.ts"
    "lib/session.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file 없음"
    fi
done

echo ""
echo "=== 프론트엔드 테스트 완료 ==="
