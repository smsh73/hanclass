# 프론트엔드 배포 현황 및 해결 방법

## 현재 상태

### 완료된 작업
- ✅ App Service Plan 생성 및 Web App 생성
- ✅ 환경 변수 설정 완료 (REST API 사용)
- ✅ Startup script 준비 완료
- ✅ 배포 ZIP 파일 준비 완료 (`frontend-final2.zip`)

### 현재 문제
- ❌ App Service의 자동 빌드가 타임아웃되거나 실패
- ❌ CLI를 통한 배포가 계속 실패

## 가장 확실한 해결 방법: Azure Portal 배포

### 단계별 가이드

1. **Azure Portal 접속**
   - https://portal.azure.com
   - `hanclass-frontend` Web App 선택

2. **배포 센터로 이동**
   - 왼쪽 메뉴에서 **배포 센터** 클릭
   - **로컬 Git** 또는 **ZIP 배포** 선택

3. **ZIP 파일 업로드**
   - 파일 위치: `/Users/seungminlee/Downloads/HANCLASS/frontend-final2.zip`
   - 드래그 앤 드롭 또는 파일 선택으로 업로드
   - 배포 시작

4. **배포 완료 대기**
   - 약 5-10분 소요
   - 배포 센터에서 진행 상황 확인 가능

5. **확인**
   - https://hanclass-frontend.azurewebsites.net 접속
   - 정상 작동 확인

## 대안: GitHub Actions 사용

장기적으로는 GitHub Actions를 통한 자동 배포가 가장 안정적입니다.

1. GitHub 저장소 생성
2. 코드 푸시
3. Azure Portal > 배포 센터 > GitHub 연동
4. 자동 빌드 및 배포 설정

## 현재 설정된 환경 변수

- `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`
- `NEXT_PUBLIC_API_URL` = `https://hanclass-backend.azurewebsites.net`
- `NODE_ENV` = `production`
- `PORT` = `8080`
- `WEBSITE_NODE_DEFAULT_VERSION` = `~20`

## Startup Command

`sh /home/site/wwwroot/startup.sh`

이 스크립트는:
1. 의존성 설치 (`npm install`)
2. Next.js 빌드 (`npm run build`)
3. 서버 시작 (`npm start`)

## 참고

배포 파일은 `/Users/seungminlee/Downloads/HANCLASS/frontend-final2.zip`에 준비되어 있습니다.

