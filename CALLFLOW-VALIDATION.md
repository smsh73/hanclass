# 프론트엔드-백엔드 콜플로우 검증 보고서

## 📋 검증 방법
각 기능별로 프론트엔드 요청과 백엔드 응답을 추적하여 정합성을 확인합니다.

---

## 1. 홈 페이지 - 세션 생성

### 프론트엔드 요청
**파일**: `frontend/app/page.tsx`
```typescript
POST /api/session/create
Body: { name: string }
```

### 백엔드 응답
**파일**: `backend/src/routes/session.ts`
```typescript
Response: {
  success: true,
  sessionId: string,
  name: string
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/session/create`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ name: string }`
- ✅ 응답 형식 일치: `{ success: true, sessionId, name }`
- ✅ 프론트엔드에서 `data.sessionId` 사용 ✅

---

## 2. 대화 학습 - 주제 가져오기

### 프론트엔드 요청
**파일**: `frontend/app/conversation/ConversationContent.tsx`
```typescript
GET /api/conversation/topics?level=beginner
```

### 백엔드 응답
**파일**: `backend/src/routes/conversation.ts`
```typescript
Response: {
  success: true,
  topics: string[]
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/conversation/topics`
- ✅ HTTP 메서드 일치: GET
- ✅ 쿼리 파라미터: `level` 사용 ✅
- ✅ 응답 형식 일치: `{ success: true, topics: string[] }`
- ✅ 프론트엔드에서 `data.topics` 배열 사용 ✅

---

## 3. 대화 학습 - 대화 시작

### 프론트엔드 요청
**파일**: `frontend/components/ChatInterface.tsx`
```typescript
POST /api/conversation/start
Body: {
  topic: string,
  level: string,
  userId?: number
}
```

### 백엔드 응답
**파일**: `backend/src/routes/conversation.ts`
```typescript
Response: {
  success: true,
  message: string,
  provider: string
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/conversation/start`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ topic, level, userId? }`
- ✅ `userId`는 선택사항 (백엔드에서 처리) ✅
- ✅ 응답 형식 일치: `{ success: true, message, provider }`
- ✅ 프론트엔드에서 `data.message` 사용 ✅

### ⚠️ 발견된 문제
- 프론트엔드에서 `userId`를 가져오기 위해 `/api/session/:sessionId` 호출
- 백엔드에서 `userId`가 없어도 대화 가능하도록 처리됨 ✅

---

## 4. 대화 학습 - 메시지 전송

### 프론트엔드 요청
**파일**: `frontend/components/ChatInterface.tsx`
```typescript
POST /api/conversation/message
Body: {
  message: string,
  topic: string,
  level: string,
  conversationHistory: Array<{ role: string, content: string }>
}
```

### 백엔드 응답
**파일**: `backend/src/routes/conversation.ts`
```typescript
Response: {
  success: true,
  message: string,
  provider: string
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/conversation/message`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ message, topic, level, conversationHistory }`
- ✅ `conversationHistory` 배열 형식 일치 ✅
- ✅ 응답 형식 일치: `{ success: true, message, provider }`
- ✅ 프론트엔드에서 `data.message` 사용 ✅

---

## 5. 레벨 테스트 - 문제 가져오기

### 프론트엔드 요청
**파일**: `frontend/app/level-test/page.tsx`
```typescript
GET /api/level-test/questions
```

### 백엔드 응답
**파일**: `backend/src/routes/levelTest.ts`
```typescript
Response: {
  success: true,
  questions: Array<{
    id: number,
    question: string,
    type: string,
    level: string,
    options?: string[],
    correctAnswer?: string
  }>
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/level-test/questions`
- ✅ HTTP 메서드 일치: GET
- ✅ 응답 형식 일치: `{ success: true, questions: Array }`
- ✅ 프론트엔드에서 `data.questions` 배열 사용 ✅

---

## 6. 레벨 테스트 - 제출

### 프론트엔드 요청
**파일**: `frontend/app/level-test/page.tsx`
```typescript
POST /api/level-test/submit
Body: {
  userId: number,
  answers: Array<{
    questionId: number,
    answer: string,
    type: string
  }>
}
```

### 백엔드 응답
**파일**: `backend/src/routes/levelTest.ts`
```typescript
Response: {
  success: true,
  result: {
    score: number,
    level: string,
    details: {
      reading: number,
      listening: number,
      speaking: number,
      writing: number
    }
  }
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/level-test/submit`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ userId, answers: Array }`
- ✅ 응답 형식 일치: `{ success: true, result }`
- ✅ 프론트엔드에서 `data.result` 사용 ✅
- ✅ 프론트엔드에서 `result.details.reading` 등 접근 ✅

### ⚠️ 발견된 문제
- 프론트엔드에서 `userId`가 없으면 alert 후 홈으로 이동 ✅
- 백엔드에서 `userId` 필수 검증 ✅

---

## 7. 단어 게임 - 단어 가져오기

### 프론트엔드 요청
**파일**: `frontend/app/word-game/page.tsx`
```typescript
GET /api/word-game/words?limit=100
```

### 백엔드 응답
**파일**: `backend/src/routes/wordGame.ts`
```typescript
Response: {
  success: true,
  words: Array<{
    id: number,
    word: string,
    difficulty: number,
    level: string
  }>
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/word-game/words`
- ✅ HTTP 메서드 일치: GET
- ✅ 쿼리 파라미터: `limit` 사용 ✅
- ✅ 응답 형식 일치: `{ success: true, words: Array }`
- ✅ 프론트엔드에서 `data.words` 배열 사용 ✅

---

## 8. 단어 게임 - 정답 확인

### 프론트엔드 요청
**파일**: `frontend/app/word-game/page.tsx`
```typescript
POST /api/word-game/check
Body: {
  word: string,
  userAnswer: string
}
```

### 백엔드 응답
**파일**: `backend/src/routes/wordGame.ts`
```typescript
Response: {
  success: true,
  correct: boolean,
  word: string,
  userAnswer: string
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/word-game/check`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ word, userAnswer }`
- ✅ 응답 형식 일치: `{ success: true, correct, word, userAnswer }`
- ✅ 프론트엔드에서 `data.correct` 사용 ✅

---

## 9. 관리자 - 로그인

### 프론트엔드 요청
**파일**: `frontend/app/admin/login/page.tsx`
```typescript
POST /api/auth/login
Body: {
  username: string,
  password: string
}
```

### 백엔드 응답
**파일**: `backend/src/routes/auth.ts`
```typescript
Response: {
  success: true,
  token: string,
  user: {
    id: number,
    username: string
  }
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/auth/login`
- ✅ HTTP 메서드 일치: POST
- ✅ 요청 형식 일치: `{ username, password }`
- ✅ 응답 형식 일치: `{ success: true, token, user }`
- ✅ 프론트엔드에서 `data.token` 사용 ✅
- ✅ 프론트엔드에서 `localStorage.setItem('adminToken', token)` ✅

---

## 10. 관리자 - API 키 관리

### 프론트엔드 요청
**파일**: `frontend/app/admin/api-keys/page.tsx`
```typescript
GET /api/admin/api-keys (Authorization: Bearer token)
POST /api/admin/api-keys (Authorization: Bearer token)
```

### 백엔드 응답
**파일**: `backend/src/routes/admin.ts`
```typescript
Response: {
  success: true,
  apiKeys: Array<{...}>
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/admin/api-keys`
- ✅ 인증: `Authorization: Bearer token` 헤더 사용 ✅
- ✅ 프론트엔드에서 `apiRequest` 함수 사용 (토큰 자동 추가) ✅

---

## 11. 관리자 - 커리큘럼 업로드

### 프론트엔드 요청
**파일**: `frontend/app/admin/curriculum/page.tsx`
```typescript
POST /api/curriculum/upload (Authorization: Bearer token)
Body: FormData
  - files: File[] (multiple files)
```

### 백엔드 응답
**파일**: `backend/src/routes/curriculum.ts`
```typescript
Response: {
  success: true,
  curriculumIds: number[],
  message: string
}
```

### ✅ 정합성 확인
- ✅ 엔드포인트 일치: `/api/curriculum/upload`
- ✅ 인증: `Authorization: Bearer token` 헤더 사용 ✅
- ✅ 요청 형식: `FormData` with `files` field ✅
- ✅ 백엔드: `upload.array('files', 10)` 사용 ✅
- ✅ 응답 형식 일치: `{ success: true, curriculumIds, message }`
- ✅ 프론트엔드에서 `data.curriculumIds` 사용 ✅

---

## 🔍 발견된 문제점 및 수정 사항

### 1. ✅ 수정 완료: 세션 조회
- **문제**: 프론트엔드에서 `userId`를 가져오기 위해 `/api/session/:sessionId` 호출
- **상태**: 정상 작동 (백엔드 엔드포인트 존재)

### 2. ✅ 수정 완료: 에러 핸들링
- **문제**: 일부 API 호출에서 에러 핸들링 부족
- **상태**: 모든 주요 API 호출에 에러 처리 추가됨

### 3. ✅ 확인 완료: 환경 변수
- **문제**: `NEXT_PUBLIC_API_URL` 사용 일관성
- **상태**: 모든 API 호출에서 일관성 있게 사용

---

## 📊 전체 정합성 검증 결과

### ✅ 통과 항목
1. ✅ 모든 API 엔드포인트 존재
2. ✅ HTTP 메서드 일치
3. ✅ 요청 형식 일치
4. ✅ 응답 형식 일치
5. ✅ 프론트엔드에서 응답 데이터 올바르게 사용
6. ✅ 에러 핸들링 완료
7. ✅ 인증 토큰 처리 정상

### ⚠️ 주의 사항
1. **데이터베이스 의존성**: 
   - `/api/conversation/topics`는 `curriculum_content` 테이블에 데이터가 있어야 함
   - `/api/word-game/words`는 `word_games` 테이블에 데이터가 있어야 함
   - `/api/level-test/questions`는 `levelTestService`에서 하드코딩된 문제 사용

2. **AI 서비스 의존성**:
   - `/api/conversation/start`, `/api/conversation/message`는 AI API 키가 설정되어 있어야 함

---

## ✅ 최종 결론

**프론트엔드와 백엔드 간의 기능상 정합성은 문제가 없습니다.**

모든 API 엔드포인트가 일치하며, 요청/응답 형식이 올바르게 매핑되어 있습니다.
에러 핸들링도 적절히 구현되어 있어 예외 상황에서도 안정적으로 동작합니다.

**단, 실제 데이터베이스에 데이터가 있어야 일부 기능이 정상 작동합니다.**
