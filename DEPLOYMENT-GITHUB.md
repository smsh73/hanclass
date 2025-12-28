# GitHub + Azure 클라우드 빌드 배포 가이드

## 설정 완료

### 1. GitHub 저장소
- **저장소**: https://github.com/smsh73/hanclass
- **브랜치**: main

### 2. Azure App Service 설정
- **배포 소스**: GitHub
- **자동 배포**: 활성화

## 추가 설정 필요

### Azure Portal에서 설정:

1. **https://portal.azure.com** 접속
2. `hanclass-frontend` Web App 선택
3. **배포 센터** 메뉴 클릭
4. **GitHub** 선택
5. **권한 부여** 클릭하여 GitHub 인증
6. 저장소 선택: `smsh73/hanclass`
7. 브랜치: `main`
8. 빌드 공급자: **GitHub Actions** 또는 **App Service build service** 선택
9. **저장** 클릭

### 환경 변수 설정:

Azure Portal > hanclass-frontend > 설정 > 구성 > 애플리케이션 설정:

```
SCM_DO_BUILD_DURING_DEPLOYMENT=true
NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=~20
```

## 배포 방법

### 자동 배포
- `main` 브랜치에 푸시하면 자동으로 배포됩니다.

### 수동 배포
```bash
git add .
git commit -m "Update"
git push origin main
```

## GitHub Actions 사용 (선택사항)

`.github/workflows/azure-deploy.yml` 파일이 생성되었습니다.
Azure Portal에서 GitHub Actions를 선택하면 이 워크플로우가 사용됩니다.

### 필요한 Secrets:
- `AZURE_WEBAPP_PUBLISH_PROFILE`: Azure Portal에서 다운로드
- `NEXT_PUBLIC_API_URL`: (선택사항) 환경 변수로 설정 가능

