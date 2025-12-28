# 프론트엔드 배포 문제 해결

## 현재 상황
- 환경 변수는 설정됨 (Azure Portal에서 확인 필요)
- 빌드가 App Service에서 실패하는 문제

## 해결 방법

### 즉시 해결: Azure Portal에서 환경 변수 확인 및 설정

1. https://portal.azure.com 접속
2. `hanclass-frontend` Web App 선택
3. 설정 > 구성 > 애플리케이션 설정
4. 다음 변수들이 올바르게 설정되어 있는지 확인:
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`
   - `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
   - `NODE_ENV` = `production`
   - `PORT` = `8080`

5. 저장 후 Web App 재시작

### 대안: 로컬 빌드 후 배포

App Service의 빌드 타임아웃 문제를 피하기 위해 로컬에서 빌드 후 배포:

```bash
cd frontend
npm install
npm run build

# 빌드된 파일 포함하여 ZIP 생성
zip -r ../frontend-built.zip . -x "node_modules/.cache/*" ".git/*" "*.log"
```

그런 다음 Azure Portal의 배포 센터에서 ZIP 파일을 업로드하거나:
```bash
az webapp deploy --resource-group hanclass-rg --name hanclass-frontend --src-path frontend-built.zip --type zip
```

### 장기 해결책: GitHub Actions

GitHub에 코드를 푸시하고 GitHub Actions를 통해 자동 빌드 및 배포를 설정하는 것이 가장 안정적입니다.

## 현재 설정
- **Startup Command**: `sh start.sh`
- **Runtime**: Node.js 20 LTS
- **Build**: 배포 시 자동 실행 (`SCM_DO_BUILD_DURING_DEPLOYMENT=true`)

