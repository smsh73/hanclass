#!/bin/sh

# Azure 환경에서 데이터베이스 마이그레이션 실행

echo "데이터베이스 마이그레이션 시작..."

# 환경 변수 확인
if [ -z "$DB_HOST" ]; then
  echo "오류: DB_HOST 환경 변수가 설정되지 않았습니다."
  exit 1
fi

# 마이그레이션 실행
cd /home/site/wwwroot
node dist/database/migrate.js

echo "마이그레이션 완료"

