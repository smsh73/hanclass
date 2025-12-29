# Azure + GitHub 클라우드 빌드 설정 완료

## ✅ 완료된 작업

1. ✅ Git 저장소 초기화
2. ✅ 모든 코드 커밋 완료
3. ✅ GitHub Actions 워크플로우 생성
4. ✅ Next.js standalone 모드 설정
5. ✅ 배포 가이드 작성

## 📋 다음 단계 (수동 작업 필요)

### 1. GitHub 저장소 생성

1. https://github.com/new 접속
2. 저장소 이름: `hanclass`
3. **Initialize this repository with a README** 체크 해제
4. **Create repository** 클릭

### 2. 코드 푸시

```bash
cd /Users/seungminlee/Downloads/HANCLASS
git push -u origin main
```

### 3. Azure Portal에서 GitHub 연동

1. **https://portal.azure.com** 접속
2. `hanclass-frontend` Web App 선택
3. **배포 센터** 메뉴 클릭
4. **소스** 섹션:
   - **GitHub** 선택
   - **권한 부여** 클릭 → GitHub 로그인
5. **조직**: `smsh73` 선택
6. **저장소**: `hanclass` 선택
7. **브랜치**: `main` 선택
8. **빌드 공급자**: **App Service build service** 선택
9. **저장** 클릭

### 4. 환경 변수 확인

Azure Portal > hanclass-frontend > 설정 > 구성 > 애플리케이션 설정:

다음 변수 확인/설정:
- `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`
- `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
- `NODE_ENV` = `production`
- `PORT` = `8080`
- `WEBSITE_NODE_DEFAULT_VERSION` = `~20`

## 🚀 자동 배포

위 설정이 완료되면:
- `main` 브랜치에 푸시할 때마다 자동 배포
- Azure Portal의 배포 센터에서 진행 상황 확인 가능

## 📁 준비된 파일

- `.github/workflows/azure-deploy.yml` - GitHub Actions 워크플로우
- `DEPLOYMENT-GITHUB.md` - 상세 배포 가이드
- `GITHUB-SETUP.md` - 설정 가이드

