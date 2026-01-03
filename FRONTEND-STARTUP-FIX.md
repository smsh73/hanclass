# 프론트엔드 시작 스크립트 수정

## 문제
1. `npm start` 스크립트에서 `require(...).default is not a function` 오류 발생
2. `.next/standalone/server.js`를 찾지 못함

## 수정 사항

### 1. package.json의 start 스크립트 수정
- 복잡한 Node.js 인라인 스크립트 제거
- 간단한 shell 스크립트로 변경

### 2. startup.sh의 서버 시작 로직 개선
- `.next/standalone/server.js` 실행 시 필요한 파일 복사
- static 파일과 public 디렉토리 확인 및 복사

## 예상 결과
- Docker 환경에서 빠른 서버 시작
- standalone 빌드가 있으면 사용, 없으면 일반 빌드 사용
