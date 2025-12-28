#!/bin/bash

# 한글학당 애플리케이션 통합 테스트 스크립트

set -e

BACKEND_URL="https://hanclass-backend.azurewebsites.net"
FRONTEND_URL="https://hanclass-frontend.azurewebsites.net"
DB_HOST="hanclass-db-23055.postgres.database.azure.com"
DB_NAME="hanclass"
DB_USER="hanclass"
DB_PASSWORD="Hanclass123!@#"

echo "=========================================="
echo "한글학당 애플리케이션 통합 테스트 시작"
echo "=========================================="
echo ""

# 테스트 결과 저장
PASSED=0
FAILED=0
TOTAL=0

# 테스트 함수
test_case() {
    local name="$1"
    local command="$2"
    TOTAL=$((TOTAL + 1))
    
    echo "[TEST $TOTAL] $name"
    if eval "$command" > /dev/null 2>&1; then
        echo "✅ PASS"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "❌ FAIL"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. 백엔드 Health Check
echo "=== 1. 백엔드 Health Check ==="
test_case "백엔드 Health Check" "curl -s $BACKEND_URL/health | grep -q 'ok'"
echo ""

# 2. 데이터베이스 연결 테스트
echo "=== 2. 데이터베이스 연결 테스트 ==="
test_case "데이터베이스 연결" "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT 1' > /dev/null 2>&1"
echo ""

# 3. 데이터베이스 스키마 테스트
echo "=== 3. 데이터베이스 스키마 테스트 ==="
test_case "users 테이블 존재" "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\d users' > /dev/null 2>&1"
test_case "admin_users 테이블 존재" "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\d admin_users' > /dev/null 2>&1"
test_case "curriculums 테이블 존재" "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\d curriculums' > /dev/null 2>&1"
test_case "api_keys 테이블 존재" "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\d api_keys' > /dev/null 2>&1"
echo ""

# 4. 세션 API 테스트
echo "=== 4. 세션 API 테스트 ==="
SESSION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/session/create" \
    -H "Content-Type: application/json" \
    -d '{"name":"테스트사용자"}')
test_case "세션 생성" "echo '$SESSION_RESPONSE' | grep -q 'success'"
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "세션 ID: $SESSION_ID"
echo ""

# 5. 커리큘럼 API 테스트
echo "=== 5. 커리큘럼 API 테스트 ==="
test_case "커리큘럼 목록 조회" "curl -s $BACKEND_URL/api/curriculum | grep -q 'success'"
echo ""

# 6. 프론트엔드 접근 테스트
echo "=== 6. 프론트엔드 접근 테스트 ==="
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ PASS - 프론트엔드 접근 가능"
    PASSED=$((PASSED + 1))
elif [ "$FRONTEND_STATUS" = "503" ]; then
    echo "❌ FAIL - 프론트엔드 서비스 불가 (503)"
    FAILED=$((FAILED + 1))
else
    echo "⚠️  WARNING - 프론트엔드 상태: $FRONTEND_STATUS"
fi
TOTAL=$((TOTAL + 1))
echo ""

# 결과 출력
echo "=========================================="
echo "테스트 결과"
echo "=========================================="
echo "총 테스트: $TOTAL"
echo "통과: $PASSED"
echo "실패: $FAILED"
echo "성공률: $((PASSED * 100 / TOTAL))%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ 모든 테스트 통과!"
    exit 0
else
    echo "❌ 일부 테스트 실패"
    exit 1
fi

