#!/bin/bash

# 간단한 Azure 배포 스크립트 (환경 변수 직접 설정)
# 사용자: seunglee@live.co.kr

set -e

# 변수 설정
RESOURCE_GROUP="hanclass-rg"
APP_NAME="hanclass-backend"
ACR_NAME="hanclassacr"
LOCATION="koreacentral"
IMAGE_NAME="hanclass-backend:latest"

echo "=== Azure 배포 시작 ==="

# Azure 로그인 확인
echo "Azure 로그인 확인 중..."
az account show || az login

# 리소스 그룹 생성
echo "리소스 그룹 생성 중..."
az group create --name $RESOURCE_GROUP --location $LOCATION || echo "리소스 그룹이 이미 존재합니다."

# Azure Container Registry 생성
echo "Azure Container Registry 생성 중..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  || echo "ACR이 이미 존재합니다."

# ACR 로그인
echo "ACR 로그인 중..."
az acr login --name $ACR_NAME

# Docker 이미지 빌드
echo "Docker 이미지 빌드 중..."
cd backend
docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME .

# 이미지 푸시
echo "이미지 푸시 중..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME

# App Service Plan 생성
echo "App Service Plan 생성 중..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1 \
  || echo "App Service Plan이 이미 존재합니다."

# Web App 생성
echo "Web App 생성 중..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --deployment-container-image-name $ACR_NAME.azurecr.io/$IMAGE_NAME \
  || echo "Web App이 이미 존재합니다."

# ACR 자격 증명 설정
echo "ACR 자격 증명 설정 중..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/$IMAGE_NAME \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# 환경 변수 설정 (직접 입력 필요)
echo "환경 변수 설정 중..."
echo "다음 환경 변수들을 설정해주세요:"
echo "  - DB_HOST"
echo "  - DB_USER"
echo "  - DB_PASSWORD"
echo "  - DB_NAME"
echo "  - JWT_SECRET"
echo "  - FRONTEND_URL"

read -p "DB_HOST를 입력하세요: " DB_HOST
read -p "DB_USER를 입력하세요: " DB_USER
read -s -p "DB_PASSWORD를 입력하세요: " DB_PASSWORD
echo
read -p "DB_NAME를 입력하세요 (기본값: hanclass): " DB_NAME
DB_NAME=${DB_NAME:-hanclass}
read -s -p "JWT_SECRET를 입력하세요: " JWT_SECRET
echo
read -p "FRONTEND_URL를 입력하세요: " FRONTEND_URL

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    DB_HOST="$DB_HOST" \
    DB_PORT=5432 \
    DB_NAME="$DB_NAME" \
    DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" \
    JWT_SECRET="$JWT_SECRET" \
    FRONTEND_URL="$FRONTEND_URL"

echo "=== 배포 완료 ==="
echo "Web App URL: https://$APP_NAME.azurewebsites.net"
echo ""
echo "데이터베이스 마이그레이션을 실행하려면 다음 명령을 실행하세요:"
echo "az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME --command 'cd /home/site/wwwroot && npm run migrate'"

