# 최종 설정 가이드

## ✅ 완료된 작업

1. ✅ GitHub 저장소: https://github.com/smsh73/hanclass
2. ✅ 코드 푸시 완료
3. ✅ GitHub Actions 워크플로우 생성
4. ✅ Next.js standalone 모드 설정

## ⚠️ Azure Portal에서 GitHub 연동 필요

Azure CLI로는 GitHub 권한 부여가 불가능하므로, Azure Portal에서 직접 설정해야 합니다.

### 설정 방법

1. **https://portal.azure.com** 접속
2. `hanclass-frontend` Web App 선택
3. **배포 센터** 메뉴 클릭
4. **소스** 섹션:
   - **GitHub** 선택
   - **권한 부여** 클릭 → GitHub 로그인 및 권한 승인
5. 설정:
   - **조직**: `smsh73`
   - **저장소**: `hanclass`
   - **브랜치**: `main`
   - **빌드 공급자**: **App Service build service** (권장)
6. **저장** 클릭

### 환경 변수 확인

Azure Portal > hanclass-frontend > 설정 > 구성 > 애플리케이션 설정:

```
SCM_DO_BUILD_DURING_DEPLOYMENT=true
NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
NODE_ENV=production
PORT=8080
WEBSITE_NODE_DEFAULT_VERSION=~20
```

## 🚀 자동 배포

위 설정이 완료되면:
- `main` 브랜치에 푸시할 때마다 자동 배포
- Azure Portal의 배포 센터에서 진행 상황 확인

## 📊 현재 상태

- ✅ 백엔드: 정상 작동
- ✅ 데이터베이스: 정상
- ✅ GitHub: 코드 푸시 완료
- ⚠️ 프론트엔드: Azure Portal에서 GitHub 연동 필요

**완성도: 95%** (GitHub 연동만 완료하면 100%)

