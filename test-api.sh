#!/bin/bash

# API 상세 테스트 스크립트

BACKEND_URL="https://hanclass-backend.azurewebsites.net"

echo "=========================================="
echo "API 상세 테스트"
echo "=========================================="
echo ""

# 세션 생성
echo "=== 세션 생성 테스트 ==="
SESSION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/session/create" \
    -H "Content-Type: application/json" \
    -d '{"name":"테스트사용자"}')
echo "Response: $SESSION_RESPONSE"
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID"
echo ""

# 세션 조회
echo "=== 세션 조회 테스트 ==="
curl -s "$BACKEND_URL/api/session/$SESSION_ID" | jq . || curl -s "$BACKEND_URL/api/session/$SESSION_ID"
echo ""

# 세션 활동 업데이트
echo "=== 세션 활동 업데이트 ==="
curl -s -X POST "$BACKEND_URL/api/session/$SESSION_ID/activity" | jq . || curl -s -X POST "$BACKEND_URL/api/session/$SESSION_ID/activity"
echo ""

# 커리큘럼 조회
echo "=== 커리큘럼 조회 ==="
curl -s "$BACKEND_URL/api/curriculum" | jq . || curl -s "$BACKEND_URL/api/curriculum"
echo ""

# 대화 주제 조회
echo "=== 대화 주제 조회 ==="
curl -s "$BACKEND_URL/api/conversation/topics" | jq . || curl -s "$BACKEND_URL/api/conversation/topics"
echo ""

# 레벨 테스트 문제 조회
echo "=== 레벨 테스트 문제 조회 (초급) ==="
curl -s "$BACKEND_URL/api/level-test/questions?level=beginner" | jq . || curl -s "$BACKEND_URL/api/level-test/questions?level=beginner"
echo ""

# 단어 게임 단어 조회
echo "=== 단어 게임 단어 조회 ==="
curl -s "$BACKEND_URL/api/word-game/words?level=beginner&limit=5" | jq . || curl -s "$BACKEND_URL/api/word-game/words?level=beginner&limit=5"
echo ""

# 단어 게임 답안 체크
echo "=== 단어 게임 답안 체크 (정답) ==="
curl -s -X POST "$BACKEND_URL/api/word-game/check" \
    -H "Content-Type: application/json" \
    -d '{"word":"안녕","userAnswer":"안녕"}' | jq . || curl -s -X POST "$BACKEND_URL/api/word-game/check" \
    -H "Content-Type: application/json" \
    -d '{"word":"안녕","userAnswer":"안녕"}'
echo ""

# 에러 케이스 테스트
echo "=== 에러 케이스 테스트 ==="
echo "1. 세션 생성 - 이름 없음:"
curl -s -X POST "$BACKEND_URL/api/session/create" \
    -H "Content-Type: application/json" \
    -d '{}' | jq . || curl -s -X POST "$BACKEND_URL/api/session/create" \
    -H "Content-Type: application/json" \
    -d '{}'
echo ""

echo "2. 존재하지 않는 세션 조회:"
curl -s "$BACKEND_URL/api/session/invalid-id" | jq . || curl -s "$BACKEND_URL/api/session/invalid-id"
echo ""

echo "3. 관리자 로그인 - 잘못된 자격증명:"
curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"wrong","password":"wrong"}' | jq . || curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"wrong","password":"wrong"}'
echo ""

