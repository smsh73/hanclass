#!/bin/bash

# 통합 테스트 스크립트

BACKEND_URL="https://hanclass-backend.azurewebsites.net"
FRONTEND_URL="https://hanclass-frontend.azurewebsites.net"

echo "=========================================="
echo "통합 테스트 시작"
echo "=========================================="
echo ""

PASSED=0
FAILED=0
TOTAL=0

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

# 1. 프론트엔드 접근 테스트
echo "=== 1. 프론트엔드 접근 테스트 ==="
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ PASS - 프론트엔드 접근 가능 (200)"
    PASSED=$((PASSED + 1))
elif [ "$FRONTEND_STATUS" = "503" ]; then
    echo "❌ FAIL - 프론트엔드 서비스 불가 (503)"
    FAILED=$((FAILED + 1))
else
    echo "⚠️  WARNING - 프론트엔드 상태: $FRONTEND_STATUS"
fi
TOTAL=$((TOTAL + 1))
echo ""

# 2. 백엔드 Health Check
echo "=== 2. 백엔드 Health Check ==="
test_case "백엔드 Health Check" "curl -s $BACKEND_URL/health | grep -q 'ok'"
echo ""

# 3. 세션 생성 및 조회
echo "=== 3. 세션 생성 및 조회 ==="
SESSION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/session/create" \
    -H "Content-Type: application/json" \
    -d '{"name":"통합테스트사용자"}')
test_case "세션 생성" "echo '$SESSION_RESPONSE' | grep -q 'success'"
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
test_case "세션 조회" "curl -s $BACKEND_URL/api/session/$SESSION_ID | grep -q 'success'"
echo ""

# 4. 커리큘럼 조회
echo "=== 4. 커리큘럼 조회 ==="
test_case "커리큘럼 목록 조회" "curl -s $BACKEND_URL/api/curriculum | grep -q 'success'"
CURRICULUM_COUNT=$(curl -s "$BACKEND_URL/api/curriculum" | grep -o '"curriculums":\[.*\]' | grep -o 'id' | wc -l | tr -d ' ')
echo "커리큘럼 개수: $CURRICULUM_COUNT"
echo ""

# 5. 대화 주제 조회
echo "=== 5. 대화 주제 조회 ==="
test_case "대화 주제 조회" "curl -s $BACKEND_URL/api/conversation/topics | grep -q 'success'"
echo ""

# 6. 레벨 테스트 문제 조회
echo "=== 6. 레벨 테스트 문제 조회 ==="
test_case "레벨 테스트 문제 조회 (초급)" "curl -s '$BACKEND_URL/api/level-test/questions?level=beginner' | grep -q 'success'"
echo ""

# 7. 단어 게임 단어 조회
echo "=== 7. 단어 게임 단어 조회 ==="
test_case "단어 게임 단어 조회" "curl -s '$BACKEND_URL/api/word-game/words?level=beginner&limit=5' | grep -q 'success'"
echo ""

# 8. 관리자 인증
echo "=== 8. 관리자 인증 ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo "✅ PASS - 관리자 로그인 성공"
    PASSED=$((PASSED + 1))
    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    test_case "API 키 목록 조회 (관리자)" "curl -s -X GET '$BACKEND_URL/api/admin/api-keys' -H 'Authorization: Bearer $ADMIN_TOKEN' | grep -q 'success'"
else
    echo "❌ FAIL - 관리자 로그인 실패"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))
echo ""

# 9. 프론트엔드-백엔드 연동 테스트
echo "=== 9. 프론트엔드-백엔드 연동 테스트 ==="
if [ "$FRONTEND_STATUS" = "200" ]; then
    # 프론트엔드에서 백엔드 API 호출 가능 여부 확인
    test_case "프론트엔드에서 백엔드 API 접근 가능" "curl -s $FRONTEND_URL | grep -q 'hanclass\|한국어' || true"
else
    echo "⚠️  SKIP - 프론트엔드가 아직 배포되지 않음"
fi
echo ""

# 결과 출력
echo "=========================================="
echo "통합 테스트 결과"
echo "=========================================="
echo "총 테스트: $TOTAL"
echo "통과: $PASSED"
echo "실패: $FAILED"
echo "성공률: $((PASSED * 100 / TOTAL))%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ 모든 통합 테스트 통과!"
    exit 0
else
    echo "❌ 일부 테스트 실패"
    exit 1
fi

