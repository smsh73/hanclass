# 한글학당 애플리케이션 상세 테스트 계획

## 테스트 목표
상용화 수준의 애플리케이션 품질 확보를 위한 철저한 테스트

## 테스트 범위

### 1. 백엔드 API 테스트

#### 1.1 세션 관리 API
- [ ] POST /api/session/create - 세션 생성
- [ ] GET /api/session/:sessionId - 세션 조회
- [ ] PUT /api/session/:sessionId/activity - 활동 업데이트
- [ ] DELETE /api/session/:sessionId - 세션 삭제
- [ ] 타임아웃 처리 테스트

#### 1.2 인증 API
- [ ] POST /api/auth/login - 관리자 로그인
- [ ] POST /api/auth/logout - 로그아웃
- [ ] JWT 토큰 검증
- [ ] 인증 실패 케이스

#### 1.3 관리자 API
- [ ] GET /api/admin/api-keys - API 키 목록 조회
- [ ] POST /api/admin/api-keys - API 키 등록
- [ ] PUT /api/admin/api-keys/:id - API 키 수정
- [ ] DELETE /api/admin/api-keys/:id - API 키 삭제
- [ ] POST /api/admin/api-keys/:id/test - API 키 테스트
- [ ] POST /api/admin/curriculum/upload - 커리큘럼 업로드
- [ ] GET /api/admin/curriculum - 커리큘럼 목록

#### 1.4 커리큘럼 API
- [ ] GET /api/curriculum - 전체 커리큘럼 조회
- [ ] GET /api/curriculum/:id - 커리큘럼 상세 조회
- [ ] POST /api/curriculum (관리자) - 커리큘럼 생성

#### 1.5 대화 학습 API
- [ ] POST /api/conversation/start - 대화 시작
- [ ] POST /api/conversation/message - 메시지 전송
- [ ] GET /api/conversation/:sessionId/history - 대화 히스토리

#### 1.6 레벨 테스트 API
- [ ] GET /api/level-test/questions - 문제 조회
- [ ] POST /api/level-test/submit - 답안 제출
- [ ] GET /api/level-test/:sessionId/result - 결과 조회

#### 1.7 단어 게임 API
- [ ] GET /api/word-game/questions - 문제 조회
- [ ] POST /api/word-game/submit - 답안 제출
- [ ] GET /api/word-game/:sessionId/result - 결과 조회

### 2. 데이터베이스 테스트

#### 2.1 스키마 검증
- [ ] 모든 테이블 존재 확인
- [ ] 제약조건 확인 (PK, FK, UNIQUE, NOT NULL)
- [ ] 인덱스 확인
- [ ] 데이터 타입 검증

#### 2.2 데이터 정합성
- [ ] 외래키 관계 검증
- [ ] 트랜잭션 처리
- [ ] 데이터 무결성

#### 2.3 마이그레이션 테스트
- [ ] 마이그레이션 실행 확인
- [ ] 롤백 테스트

### 3. 프론트엔드 테스트

#### 3.1 랜딩 페이지
- [ ] 페이지 로드
- [ ] 메뉴 카드 표시
- [ ] 세션 입력 모달

#### 3.2 레벨 테스트 페이지
- [ ] 문제 표시
- [ ] 음성 인식
- [ ] 답안 제출
- [ ] 결과 표시

#### 3.3 대화 학습 페이지
- [ ] 챗봇 UI 표시
- [ ] 음성 입력/출력
- [ ] 메시지 히스토리
- [ ] AI 응답 처리

#### 3.4 단어 게임 페이지
- [ ] 단어 표시
- [ ] 타이머 작동
- [ ] 음성 인식
- [ ] 점수 계산

#### 3.5 관리자 페이지
- [ ] 로그인
- [ ] API 키 관리
- [ ] 커리큘럼 업로드
- [ ] 파일 업로드 (PDF/Word)

### 4. 통합 테스트

#### 4.1 프론트엔드-백엔드 연동
- [ ] API 호출 정상 동작
- [ ] 에러 처리
- [ ] CORS 설정
- [ ] 인증 토큰 전달

#### 4.2 음성 기능 통합
- [ ] 음성 인식 → 백엔드 전송
- [ ] 백엔드 응답 → 음성 출력
- [ ] 동시성 처리

### 5. 에러 처리 테스트

#### 5.1 입력 검증
- [ ] 잘못된 입력값 처리
- [ ] 필수 필드 검증
- [ ] 타입 검증

#### 5.2 예외 상황
- [ ] 네트워크 오류
- [ ] 데이터베이스 오류
- [ ] API 오류
- [ ] 파일 업로드 오류

### 6. 보안 테스트

#### 6.1 인증/인가
- [ ] JWT 토큰 검증
- [ ] 권한 체크
- [ ] 세션 관리

#### 6.2 입력 검증
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] 파일 업로드 보안

### 7. 성능 테스트

#### 7.1 응답 시간
- [ ] API 응답 시간
- [ ] 페이지 로드 시간
- [ ] 데이터베이스 쿼리 성능

#### 7.2 동시성
- [ ] 다중 사용자 처리
- [ ] 동시 요청 처리

## 테스트 실행 순서

1. 백엔드 API 단위 테스트
2. 데이터베이스 스키마 검증
3. 프론트엔드 기능 테스트
4. 통합 테스트
5. 에러 처리 테스트
6. 보안 테스트
7. 성능 테스트

## 테스트 결과 문서화

각 테스트 결과를 기록하고, 발견된 문제점을 이슈로 관리합니다.

