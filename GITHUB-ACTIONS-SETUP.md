# GitHub Actions를 통한 Azure 자동 배포 설정

## 개요

이 프로젝트는 GitHub Actions를 통해 자동으로:
1. Docker 이미지 빌드
2. Azure Container Registry (ACR)에 이미지 푸시
3. Azure App Service에 자동 배포

## 사전 준비 사항

### 1. Azure 리소스 확인

- **ACR**: `hanclassacr.azurecr.io`
- **Backend App Service**: `hanclass-backend`
- **Frontend App Service**: `hanclass-frontend`
- **Resource Group**: `hanclass-rg`

### 2. GitHub Secrets 설정

GitHub 저장소에 다음 Secrets를 설정해야 합니다:

#### GitHub 저장소 설정 방법:
1. https://github.com/smsh73/hanclass 접속
2. **Settings** > **Secrets and variables** > **Actions** 클릭
3. **New repository secret** 클릭하여 다음 Secrets 추가:

#### 필수 Secrets:

##### 1. AZURE_CREDENTIALS
Azure Service Principal의 전체 JSON을 설정합니다. 다음 명령어로 생성:
```bash
az ad sp create-for-rbac --name "hanclass-github-actions" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/hanclass-rg \
  --sdk-auth
```
출력된 전체 JSON을 그대로 복사하여 Secret 값으로 설정합니다.

##### 2. AZURE_ACR_USERNAME
ACR 관리자 사용자명을 설정합니다:
```bash
az acr credential show --name hanclassacr --query username -o tsv
```

##### 3. AZURE_ACR_PASSWORD
ACR 관리자 비밀번호를 설정합니다:
```bash
az acr credential show --name hanclassacr --query "passwords[0].value" -o tsv
```

## 워크플로우 설명

### Backend 배포 (`.github/workflows/backend-deploy.yml`)

**트리거 조건:**
- `main` 브랜치에 푸시
- `backend/**` 경로 변경
- 수동 트리거 (workflow_dispatch)

**작업 순서:**
1. 코드 체크아웃
2. Docker Buildx 설정
3. ACR 로그인
4. Docker 이미지 빌드 및 푸시
5. Azure 로그인
6. App Service에 배포

### Frontend 배포 (`.github/workflows/frontend-deploy.yml`)

**트리거 조건:**
- `main` 브랜치에 푸시
- `frontend/**` 경로 변경
- 수동 트리거 (workflow_dispatch)

**작업 순서:**
1. 코드 체크아웃
2. Docker Buildx 설정
3. ACR 로그인
4. Docker 이미지 빌드 및 푸시 (NEXT_PUBLIC_API_URL 포함)
5. Azure 로그인
6. App Service에 배포

## Docker 이미지 구조

### Backend (`backend/Dockerfile`)
- Base: `node:18-alpine`
- 빌드: TypeScript 컴파일
- 실행: `node dist/index.js`
- 포트: 3001

### Frontend (`frontend/Dockerfile`)
- Base: `node:20-alpine`
- 빌드: Next.js standalone 모드
- 실행: `node server.js`
- 포트: 8080

## 배포 확인

### GitHub Actions에서 확인
1. https://github.com/smsh73/hanclass/actions 접속
2. 실행 중인 워크플로우 확인
3. 각 단계의 로그 확인

### Azure Portal에서 확인
1. https://portal.azure.com 접속
2. **hanclass-backend** 또는 **hanclass-frontend** 선택
3. **배포 센터** > **로그** 확인

### 애플리케이션 확인
- Backend: https://hanclass-backend.azurewebsites.net
- Frontend: https://hanclass-frontend.azurewebsites.net

## 문제 해결

### 배포 실패 시

1. **GitHub Actions 로그 확인**
   - Actions 탭에서 실패한 워크플로우 클릭
   - 실패한 단계의 로그 확인

2. **Azure 로그 확인**
   ```bash
   az webapp log tail --resource-group hanclass-rg --name hanclass-backend
   az webapp log tail --resource-group hanclass-rg --name hanclass-frontend
   ```

3. **ACR 이미지 확인**
   ```bash
   az acr repository list --name hanclassacr --output table
   az acr repository show-tags --name hanclassacr --repository hanclass-backend
   az acr repository show-tags --name hanclassacr --repository hanclass-frontend
   ```

### 일반적인 문제

#### 1. Secrets 미설정
- **증상**: "Authentication failed" 오류
- **해결**: GitHub Secrets 확인

#### 2. Docker 빌드 실패
- **증상**: "Build failed" 오류
- **해결**: Dockerfile 및 의존성 확인

#### 3. 배포 실패
- **증상**: "Deployment failed" 오류
- **해결**: App Service 설정 및 이미지 태그 확인

## 수동 배포

필요시 수동으로 배포할 수 있습니다:

```bash
# Backend
az webapp deployment container config \
  --name hanclass-backend \
  --resource-group hanclass-rg \
  --docker-custom-image-name hanclassacr.azurecr.io/hanclass-backend:latest

# Frontend
az webapp deployment container config \
  --name hanclass-frontend \
  --resource-group hanclass-rg \
  --docker-custom-image-name hanclassacr.azurecr.io/hanclass-frontend:latest
```

## 보안 참고사항

⚠️ **중요**: 이 문서에 포함된 자격 증명은 예시입니다. 실제 사용 시:
1. GitHub Secrets에 안전하게 저장
2. 코드에 직접 포함하지 않음
3. 정기적으로 비밀번호 변경

## 다음 단계

1. ✅ GitHub Secrets 설정
2. ✅ 코드 푸시하여 자동 배포 테스트
3. ✅ 배포 로그 확인
4. ✅ 애플리케이션 동작 확인

