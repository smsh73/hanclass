# 프론트엔드 수동 배포 가이드

## 현재 문제
App Service의 자동 빌드가 실패하여 수동 배포가 필요합니다.

## 해결 방법 1: Azure Portal 배포 센터 사용 (가장 확실)

1. https://portal.azure.com 접속
2. `hanclass-frontend` Web App 선택
3. **배포 센터** 메뉴 클릭
4. **로컬 Git** 또는 **ZIP 배포** 선택
5. `frontend-final2.zip` 파일 업로드
6. 배포 완료 대기

## 해결 방법 2: 로컬에서 빌드 후 배포

```bash
cd frontend
npm install
npm run build

# 빌드된 파일 포함하여 ZIP 생성
cd ..
zip -r frontend-built.zip frontend/.next frontend/package.json frontend/public frontend/app frontend/components frontend/lib frontend/*.js frontend/*.json frontend/*.ts frontend/*.tsx frontend/startup.sh -x "*.log"
```

그런 다음 Azure Portal 배포 센터에서 `frontend-built.zip` 업로드

## 해결 방법 3: GitHub Actions 설정 (장기적 해결책)

1. GitHub 저장소 생성
2. 코드 푸시
3. Azure Portal에서 배포 센터 > GitHub 연동
4. 자동 빌드 및 배포 설정

## 현재 설정 확인

환경 변수는 이미 설정되어 있습니다:
- `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`
- `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
- `NODE_ENV` = `production`
- `PORT` = `8080`

Startup Command: `sh /home/site/wwwroot/startup.sh`

## 다음 단계

가장 확실한 방법은 **Azure Portal의 배포 센터에서 ZIP 파일을 직접 업로드**하는 것입니다.

