# GitHub + Azure 배포 설정 가이드

## 1단계: GitHub 저장소 생성

1. https://github.com/new 접속
2. 저장소 이름: `hanclass`
3. Public 또는 Private 선택
4. **Initialize this repository with a README** 체크 해제 (이미 코드가 있음)
5. **Create repository** 클릭

## 2단계: 로컬 코드 푸시

```bash
cd /Users/seungminlee/Downloads/HANCLASS
git remote add origin https://github.com/smsh73/hanclass.git
git branch -M main
git push -u origin main
```

또는 GitHub에서 제공하는 명령어 사용:
```bash
git remote add origin https://github.com/smsh73/hanclass.git
git branch -M main
git push -u origin main
```

## 3단계: Azure Portal에서 GitHub 연동

1. **https://portal.azure.com** 접속
2. `hanclass-frontend` Web App 선택
3. **배포 센터** 메뉴 클릭
4. **소스** 선택:
   - **GitHub** 선택
   - **권한 부여** 클릭하여 GitHub 인증
5. **조직**: `smsh73` 선택
6. **저장소**: `hanclass` 선택
7. **브랜치**: `main` 선택
8. **빌드 공급자**: 
   - **App Service build service** 선택 (권장)
   - 또는 **GitHub Actions** 선택
9. **저장** 클릭

## 4단계: 환경 변수 확인

Azure Portal > hanclass-frontend > 설정 > 구성 > 애플리케이션 설정:

다음 변수들이 설정되어 있는지 확인:
- `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`
- `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
- `NODE_ENV` = `production`
- `PORT` = `8080`
- `WEBSITE_NODE_DEFAULT_VERSION` = `~20`

## 5단계: 자동 배포 테스트

저장소에 푸시하면 자동으로 배포가 시작됩니다:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

Azure Portal의 배포 센터에서 배포 진행 상황을 확인할 수 있습니다.

## 문제 해결

### GitHub Actions를 사용하는 경우

`.github/workflows/azure-deploy.yml` 파일이 이미 생성되어 있습니다.

필요한 Secrets 설정:
1. GitHub 저장소 > Settings > Secrets and variables > Actions
2. 다음 Secrets 추가:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Azure Portal에서 다운로드
     - hanclass-frontend > 배포 센터 > 게시 프로필 다운로드

### 빌드 실패 시

1. Azure Portal > hanclass-frontend > 배포 센터 > 로그 확인
2. 빌드 로그에서 에러 확인
3. 필요시 환경 변수 재확인

