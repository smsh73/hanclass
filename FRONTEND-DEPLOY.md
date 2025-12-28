# 프론트엔드 배포 가이드

## 문제점
Next.js 앱을 Azure App Service에 배포할 때 빌드 시간이 오래 걸려 자동 빌드가 실패할 수 있습니다.

## 해결 방법

### 방법 1: 로컬에서 빌드 후 배포 (권장)

1. 로컬에서 빌드:
```bash
cd frontend
npm install
npm run build
```

2. 빌드된 파일을 ZIP으로 압축:
```bash
# .next 폴더와 필요한 파일만 포함
zip -r ../frontend-built.zip .next package.json package-lock.json node_modules public .next/standalone -x "*.log" "*.zip"
```

3. 배포:
```bash
az webapp deploy --resource-group hanclass-rg --name hanclass-frontend --src-path frontend-built.zip --type zip
```

### 방법 2: Azure Portal에서 환경 변수 설정 후 재배포

1. Azure Portal에서 `hanclass-frontend` Web App 선택
2. 설정 > 구성 > 애플리케이션 설정
3. 다음 변수 추가:
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`
   - `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
   - `NODE_ENV` = `production`
   - `PORT` = `8080`

4. 저장 후 재시작

### 방법 3: GitHub Actions 사용 (장기적 해결책)

GitHub에 코드를 푸시하고 GitHub Actions를 통해 자동 빌드 및 배포를 설정하는 것이 가장 안정적입니다.

## 현재 설정

- **Startup Command**: `sh start.sh`
- **Runtime**: Node.js 20 LTS
- **Build**: `npm run build` (배포 시 자동 실행)

