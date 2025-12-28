# Azure 배포 가이드

## 사전 요구사항

1. Azure CLI 설치
2. Docker 설치
3. Node.js 18+ 설치
4. Azure 계정 (seunglee@live.co.kr)

## 1. 종속 패키지 설치

```bash
# 루트 디렉토리에서 실행
npm install

# Frontend 패키지 설치
cd frontend
npm install
cd ..

# Backend 패키지 설치
cd backend
npm install
cd ..
```

또는 스크립트 사용:
```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

## 2. 데이터베이스 마이그레이션

### 로컬 환경에서 마이그레이션 실행

```bash
cd backend
npm run migrate:dev
```

### Azure 환경에서 마이그레이션 실행

배포 후 Azure Portal에서 또는 SSH를 통해 실행:

```bash
az webapp ssh --resource-group hanclass-rg --name hanclass-backend --command "cd /home/site/wwwroot && npm run migrate"
```

또는 Dockerfile에서 자동 실행되도록 설정되어 있습니다.

## 3. Azure 배포

### 방법 1: 간단한 배포 스크립트 사용

```bash
chmod +x azure-deploy-simple.sh
./azure-deploy-simple.sh
```

스크립트가 다음을 수행합니다:
- Azure 로그인 확인
- 리소스 그룹 생성
- Azure Container Registry 생성
- Docker 이미지 빌드 및 푸시
- App Service 생성 및 배포
- 환경 변수 설정 (대화형 입력)

### 방법 2: 수동 배포

#### 3.1 Azure 로그인

```bash
az login
az account set --subscription "your-subscription-id"
```

#### 3.2 리소스 그룹 생성

```bash
az group create --name hanclass-rg --location koreacentral
```

#### 3.3 Azure Container Registry 생성

```bash
az acr create \
  --resource-group hanclass-rg \
  --name hanclassacr \
  --sku Basic \
  --admin-enabled true
```

#### 3.4 ACR 로그인

```bash
az acr login --name hanclassacr
```

#### 3.5 Docker 이미지 빌드 및 푸시

```bash
cd backend
docker build -t hanclassacr.azurecr.io/hanclass-backend:latest .
docker push hanclassacr.azurecr.io/hanclass-backend:latest
```

#### 3.6 App Service Plan 생성

```bash
az appservice plan create \
  --name hanclass-backend-plan \
  --resource-group hanclass-rg \
  --location koreacentral \
  --is-linux \
  --sku B1
```

#### 3.7 Web App 생성

```bash
az webapp create \
  --resource-group hanclass-rg \
  --plan hanclass-backend-plan \
  --name hanclass-backend \
  --deployment-container-image-name hanclassacr.azurecr.io/hanclass-backend:latest
```

#### 3.8 ACR 자격 증명 설정

```bash
ACR_USERNAME=$(az acr credential show --name hanclassacr --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name hanclassacr --query passwords[0].value -o tsv)

az webapp config container set \
  --name hanclass-backend \
  --resource-group hanclass-rg \
  --docker-custom-image-name hanclassacr.azurecr.io/hanclass-backend:latest \
  --docker-registry-server-url https://hanclassacr.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD
```

#### 3.9 환경 변수 설정

```bash
az webapp config appsettings set \
  --resource-group hanclass-rg \
  --name hanclass-backend \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    DB_HOST="your-db-host" \
    DB_PORT=5432 \
    DB_NAME=hanclass \
    DB_USER="your-db-user" \
    DB_PASSWORD="your-db-password" \
    JWT_SECRET="your-jwt-secret" \
    FRONTEND_URL="https://your-frontend-url.com"
```

## 4. PostgreSQL 데이터베이스 설정

Azure Database for PostgreSQL을 사용하는 경우:

```bash
# PostgreSQL 서버 생성
az postgres flexible-server create \
  --resource-group hanclass-rg \
  --name hanclass-db \
  --location koreacentral \
  --admin-user hanclass \
  --admin-password "your-secure-password" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32

# 데이터베이스 생성
az postgres flexible-server db create \
  --resource-group hanclass-rg \
  --server-name hanclass-db \
  --database-name hanclass
```

## 5. 배포 확인

```bash
# 로그 확인
az webapp log tail --resource-group hanclass-rg --name hanclass-backend

# 상태 확인
az webapp show --resource-group hanclass-rg --name hanclass-backend --query state
```

## 6. 트러블슈팅

### 마이그레이션 실패 시

SSH를 통해 직접 실행:
```bash
az webapp ssh --resource-group hanclass-rg --name hanclass-backend
cd /home/site/wwwroot
npm run migrate
```

### 로그 확인

```bash
az webapp log tail --resource-group hanclass-rg --name hanclass-backend
```

### 환경 변수 확인

```bash
az webapp config appsettings list --resource-group hanclass-rg --name hanclass-backend
```

## 7. 업데이트 배포

코드 변경 후 재배포:

```bash
cd backend
docker build -t hanclassacr.azurecr.io/hanclass-backend:latest .
docker push hanclassacr.azurecr.io/hanclass-backend:latest

# Web App 재시작
az webapp restart --resource-group hanclass-rg --name hanclass-backend
```

