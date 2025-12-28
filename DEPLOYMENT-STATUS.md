# 배포 상태

## 완료된 작업

### 백엔드
- ✅ Azure Container Registry 생성: `hanclassacr`
- ✅ Docker 이미지 빌드 및 푸시 완료
- ✅ App Service Plan 생성: `hanclass-backend-plan`
- ✅ Web App 생성: `hanclass-backend`
- ✅ PostgreSQL 데이터베이스 생성: `hanclass-db-23055`
- ✅ 데이터베이스 생성: `hanclass`

**백엔드 URL**: https://hanclass-backend.azurewebsites.net

### 프론트엔드
- ✅ App Service Plan 생성: `hanclass-frontend-plan`
- ✅ Web App 생성: `hanclass-frontend`
- ⚠️ 배포 진행 중 (빌드 실패 - 재시도 필요)

**프론트엔드 URL**: https://hanclass-frontend.azurewebsites.net

## 필요한 작업

### 백엔드 환경 변수 설정
Azure Portal에서 다음 환경 변수를 설정하세요:

1. https://portal.azure.com 접속
2. `hanclass-backend` Web App 선택
3. 설정 > 구성 > 애플리케이션 설정
4. 다음 변수 추가:

```
NODE_ENV = production
PORT = 3001
DB_HOST = hanclass-db-23055.postgres.database.azure.com
DB_PORT = 5432
DB_NAME = hanclass
DB_USER = hanclass
DB_PASSWORD = Hanclass123!@#
JWT_SECRET = hanclass-jwt-secret-key-2024-production
ENCRYPTION_KEY = hanclass-encryption-key-32-chars-long!!
FRONTEND_URL = https://hanclass-frontend.azurewebsites.net
```

### 프론트엔드 환경 변수 설정
Azure Portal에서 다음 환경 변수를 설정하세요:

1. `hanclass-frontend` Web App 선택
2. 설정 > 구성 > 애플리케이션 설정
3. 다음 변수 추가:

```
SCM_DO_BUILD_DURING_DEPLOYMENT = true
NEXT_PUBLIC_API_URL = https://hanclass-backend.azurewebsites.net
NODE_ENV = production
```

### 프론트엔드 재배포
환경 변수 설정 후 다음 명령으로 재배포:

```bash
cd frontend
zip -r ../frontend.zip . -x "node_modules/*" ".next/*" ".git/*" "*.log"
az webapp deploy --resource-group hanclass-rg --name hanclass-frontend --src-path frontend.zip --type zip
```

또는 Azure Portal의 배포 센터에서 GitHub 연동 또는 로컬 Git 배포를 사용할 수 있습니다.

## 리소스 정보

- **리소스 그룹**: `hanclass-rg`
- **위치**: Korea Central
- **PostgreSQL 서버**: `hanclass-db-23055.postgres.database.azure.com`
- **데이터베이스**: `hanclass`
- **사용자**: `hanclass`
- **비밀번호**: `Hanclass123!@#`

