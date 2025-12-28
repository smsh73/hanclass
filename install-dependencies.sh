#!/bin/bash

# 종속 패키지 설치 스크립트

set -e

echo "=== 종속 패키지 설치 시작 ==="

# 루트 패키지 설치
echo "루트 패키지 설치 중..."
npm install

# Frontend 패키지 설치
echo "Frontend 패키지 설치 중..."
cd frontend
npm install
cd ..

# Backend 패키지 설치
echo "Backend 패키지 설치 중..."
cd backend
npm install
cd ..

echo "=== 종속 패키지 설치 완료 ==="

