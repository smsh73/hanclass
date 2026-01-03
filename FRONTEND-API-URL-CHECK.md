# 프론트엔드 백엔드 URL 점검 보고서

## 📋 점검 결과

### ✅ 환경 변수 설정

1. **Dockerfile** (빌드 타임):
   ```dockerfile
   ARG NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
   ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
   ```
   ✅ Azure 백엔드 URL로 설정됨

2. **GitHub Actions** (빌드 인자):
   ```yaml
   build-args: |
     NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
   ```
   ✅ Azure 백엔드 URL로 전달됨

3. **next.config.js** (기본값):
   ```javascript
   env: {
     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
   }
   ```
   ⚠️ 기본값이 localhost이지만, 빌드 시 환경 변수로 덮어쓰기됨

### ✅ API 호출 위치별 확인

#### 1. lib/api.ts
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용
- ⚠️ 기본값: localhost (빌드 시 환경 변수로 덮어쓰기됨)

#### 2. app/page.tsx (홈 페이지)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/session/create\`)
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용

#### 3. app/level-test/page.tsx (레벨 테스트)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/level-test/questions\`)
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/session/\${sessionId}\`)
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/level-test/submit\`)
```
- ✅ 모든 호출에서 `process.env.NEXT_PUBLIC_API_URL` 사용

#### 4. app/conversation/ConversationContent.tsx (대화 학습)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/conversation/topics?level=\${level}\`)
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용

#### 5. components/ChatInterface.tsx (채팅 인터페이스)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/session/\${sessionId}\`)
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start\`)
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message\`)
```
- ✅ 모든 호출에서 `process.env.NEXT_PUBLIC_API_URL` 사용

#### 6. app/word-game/page.tsx (단어 게임)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/word-game/words?limit=100\`)
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/word-game/check\`)
```
- ✅ 모든 호출에서 `process.env.NEXT_PUBLIC_API_URL` 사용

#### 7. app/admin/login/page.tsx (관리자 로그인)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/auth/login\`)
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용

#### 8. app/admin/curriculum/page.tsx (커리큘럼 업로드)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/curriculum/upload\`)
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용

#### 9. lib/session.ts (세션 관리)
```typescript
fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/session/\${sessionId}\`)
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용

### ✅ next.config.js rewrites
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*\`,
    },
  ];
}
```
- ✅ `process.env.NEXT_PUBLIC_API_URL` 사용
- ⚠️ 기본값: localhost (빌드 시 환경 변수로 덮어쓰기됨)

## 📊 점검 결과 요약

### ✅ 정상 항목
- 모든 API 호출이 `process.env.NEXT_PUBLIC_API_URL` 사용
- Dockerfile에서 Azure 백엔드 URL로 설정
- GitHub Actions에서 빌드 인자로 Azure 백엔드 URL 전달
- 하드코딩된 localhost URL 없음

### ⚠️ 주의 사항
- `next.config.js`와 `lib/api.ts`의 기본값이 localhost
- 하지만 빌드 시 환경 변수로 덮어쓰기되므로 문제 없음
- 런타임에 환경 변수가 없으면 localhost 사용 (하지만 Docker 빌드 시 항상 설정됨)

## ✅ 최종 결론

**프론트엔드 소스코드는 Azure 백엔드를 바라보도록 올바르게 설정되어 있습니다.**

- 빌드 타임에 `NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net`로 설정됨
- 모든 API 호출이 환경 변수를 사용
- 하드코딩된 localhost URL 없음

다만, Azure App Service에서도 환경 변수를 설정하면 이중 보호가 됩니다:
- Azure Portal > hanclass-frontend > Configuration > Application settings
- `NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net` 추가
