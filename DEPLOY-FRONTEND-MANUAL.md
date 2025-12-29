# 프론트엔드 수동 배포 가이드

## 현재 상황
- GitHub 저장소: https://github.com/smsh73/hanclass
- 코드 푸시: 완료
- Azure 자동 배포: GitHub 연동 필요 (권한 부여 필요)

## 해결 방법

### 방법 1: Azure Portal에서 GitHub 연동 (권장)

1. **Azure Portal 접속**: https://portal.azure.com
2. **hanclass-frontend** Web App 선택
3. **배포 센터** 메뉴 클릭
4. **소스** 섹션:
   - **GitHub** 선택
   - **권한 부여** 클릭 → GitHub 로그인 및 권한 승인
5. 설정:
   - **조직**: `smsh73`
   - **저장소**: `hanclass`
   - **브랜치**: `main`
   - **빌드 공급자**: **App Service build service**
6. **저장** 클릭
7. **동기화** 버튼 클릭하여 즉시 배포 시작

### 방법 2: Local Git 배포

```bash
# Azure Local Git URL 가져오기
az webapp deployment source config-local-git \
  --resource-group hanclass-rg \
  --name hanclass-frontend

# Local Git remote 추가 (출력된 URL 사용)
git remote add azure <출력된-URL>

# 프론트엔드 디렉토리로 이동하여 배포
cd frontend
git subtree push --prefix frontend azure main
```

### 방법 3: ZIP 배포

```bash
cd frontend
npm install --legacy-peer-deps
npm run build

# .next 디렉토리와 필요한 파일들을 ZIP으로 압축
zip -r ../frontend-deploy.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.log"

# Azure에 배포
az webapp deployment source config-zip \
  --resource-group hanclass-rg \
  --name hanclass-frontend \
  --src ../frontend-deploy.zip
```

## 수정된 startup.sh 주요 변경사항

1. **기존 node_modules 정리**: 권한 문제 해결
2. **npm cache 정리**: 깨끗한 설치 보장
3. **에러 처리 개선**: 실패 시 재시도 로직
4. **next 명령어 검증**: 설치 확인

## 배포 확인

배포 완료 후:
```bash
curl -I https://hanclass-frontend.azurewebsites.net
```

정상 응답: `HTTP/2 200`
오류 응답: `HTTP/2 503` (Application Error)

## 문제 해결

### 503 에러가 계속 발생하는 경우

1. **로그 확인**:
   ```bash
   az webapp log tail --resource-group hanclass-rg --name hanclass-frontend
   ```

2. **환경 변수 확인**:
   ```bash
   az webapp config appsettings list \
     --resource-group hanclass-rg \
     --name hanclass-frontend
   ```

3. **필수 환경 변수**:
   - `NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net`
   - `NODE_ENV=production`
   - `PORT=8080`
