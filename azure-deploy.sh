#!/bin/bash

# Azure 배포 스크립트
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

# 환경 변수 설정 (필요시 수정)
echo "환경 변수 설정 중..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    DB_HOST="@Microsoft.KeyVault(SecretUri=https://hanclass-kv.vault.azure.net/secrets/db-host/)" \
    DB_PORT=5432 \
    DB_NAME=hanclass \
    DB_USER="@Microsoft.KeyVault(SecretUri=https://hanclass-kv.vault.azure.net/secrets/db-user/)" \
    DB_PASSWORD="@Microsoft.KeyVault(SecretUri=https://hanclass-kv.vault.azure.net/secrets/db-password/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://hanclass-kv.vault.azure.net/secrets/jwt-secret/)" \
    FRONTEND_URL="https://hanclass-frontend.azurewebsites.net" \
  || echo "환경 변수 설정을 건너뜁니다. (Key Vault가 없을 수 있습니다)"

# 데이터베이스 마이그레이션 실행
echo "데이터베이스 마이그레이션 실행 중..."
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME --command "cd /home/site/wwwroot && npm run migrate" || echo "마이그레이션 실행 실패 (수동 실행 필요)"

echo "=== 배포 완료 ==="
echo "Web App URL: https://$APP_NAME.azurewebsites.net"

