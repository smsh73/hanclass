# 한글학당 (HANCLASS) 아키텍처 검증 보고서

## 📋 실행 요약

이 문서는 한글학당 애플리케이션의 전체 아키텍처, 구조, 서비스 로직을 전문 아키텍트 관점에서 검증한 결과입니다.

**전체 평가: 7.5/10**
- ✅ **강점**: 명확한 레이어 분리, AI Fallback 시스템, 타입 안정성
- ⚠️ **개선 필요**: 보안 강화, 에러 처리 일관성, 모니터링 및 로깅

---

## 1. 전체 아키텍처 구조

### 1.1 아키텍처 패턴
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Pages  │  │Components│  │   Lib    │  │  Types  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Express/Node.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Routes  │→ │ Services  │→ │Database  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐                            │
│  │Middleware│  │   Utils  │                            │
│  └──────────┘  └──────────┘                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Users   │  │Curriculums│  │API Keys  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

**평가: ✅ 양호**
- **레이어 분리**: Routes → Services → Database 명확한 3-tier 구조
- **관심사 분리**: 각 레이어가 명확한 책임을 가짐
- **확장성**: 새로운 기능 추가 시 구조 유지 가능

### 1.2 기술 스택
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI, Claude, Gemini (Fallback)
- **Deployment**: Azure App Service, Azure Container Registry, Docker

**평가: ✅ 적절**
- 최신 기술 스택 사용
- TypeScript로 타입 안정성 확보
- Docker 컨테이너화로 배포 일관성

---

## 2. 프론트엔드 구조 검증

### 2.1 디렉토리 구조
```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈 페이지
│   ├── level-test/        # 레벨 테스트
│   ├── conversation/      # 자유 대화
│   ├── word-game/         # 단어 게임
│   └── admin/             # 관리자 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── ChatInterface.tsx
│   ├── VoiceRecorder.tsx
│   └── VoicePlayer.tsx
└── lib/                   # 유틸리티 함수
    ├── api.ts
    ├── voice.ts
    └── session.ts
```

**평가: ✅ 양호**
- Next.js 14 App Router 패턴 준수
- 컴포넌트와 로직 분리 명확
- 재사용 가능한 컴포넌트 구조

### 2.2 상태 관리
- **세션 관리**: `sessionStorage` 사용
- **관리자 인증**: `localStorage` 사용
- **전역 상태**: React Context 또는 Zustand 미사용

**평가: ⚠️ 개선 필요**
- **문제점**:
  - 세션 정보가 클라이언트에만 저장됨 (서버 검증 없음)
  - `sessionStorage`는 탭 간 공유 안 됨
  - 상태 관리 라이브러리 미사용으로 복잡한 상태 관리 어려움

**권장 사항**:
1. 서버 사이드 세션 검증 추가
2. 복잡한 상태는 Zustand 또는 Context API 사용
3. 세션 만료 시 자동 갱신 로직 추가

### 2.3 API 통신
```typescript
// frontend/lib/api.ts
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  // ...
}
```

**평가: ⚠️ 개선 필요**
- **문제점**:
  - 에러 처리 일관성 부족
  - 재시도 로직 없음
  - 타임아웃 설정 없음
  - 네트워크 오류 처리 미흡

**권장 사항**:
1. Axios 또는 Fetch wrapper로 통합 에러 처리
2. 자동 재시도 로직 추가
3. 요청 타임아웃 설정
4. 네트워크 오류 시 사용자 친화적 메시지

### 2.4 SSR/CSR 처리
- **SSR 체크**: `typeof window !== 'undefined'` 사용
- **문제점**: 일부 컴포넌트에서 SSR 체크 누락 가능성

**평가: ⚠️ 개선 필요**
- **권장 사항**:
  1. `useEffect` 훅으로 클라이언트 사이드에서만 실행되는 로직 보장
  2. Next.js `dynamic` import로 클라이언트 전용 컴포넌트 처리

---

## 3. 백엔드 구조 검증

### 3.1 라우팅 구조
```
backend/src/routes/
├── auth.ts          # 인증
├── admin.ts         # 관리자
├── conversation.ts  # 대화
├── curriculum.ts    # 커리큘럼
├── levelTest.ts     # 레벨 테스트
├── session.ts       # 세션
└── wordGame.ts      # 단어 게임
```

**평가: ✅ 양호**
- RESTful API 패턴 준수
- 기능별 라우트 분리 명확
- `/api` prefix 일관성 유지

### 3.2 서비스 레이어
```
backend/src/services/
├── aiService.ts          # AI API Fallback
├── curriculumService.ts  # 커리큘럼 로직
├── documentParser.ts     # 문서 파싱
├── levelTestService.ts  # 레벨 테스트 로직
└── voiceService.ts       # 음성 처리
```

**평가: ✅ 우수**
- **AI Fallback 시스템**: Primary/Fallback 자동 전환 구현
- **비즈니스 로직 분리**: Routes에서 비즈니스 로직 분리
- **재사용성**: 서비스 레이어 재사용 가능

### 3.3 AI 서비스 아키텍처
```typescript
// aiService.ts
- Primary Provider 설정
- Fallback Providers 자동 전환
- API 키 암호화 저장
- 연결 테스트 기능
```

**평가: ✅ 우수**
- **장애 대응**: AI API 실패 시 자동 Fallback
- **보안**: API 키 암호화 저장
- **유연성**: Primary/Fallback 동적 설정

**개선 사항**:
1. Rate Limiting 추가
2. AI 응답 캐싱 고려
3. 비용 모니터링 추가

### 3.4 에러 처리
```typescript
// middleware/errorHandler.ts
export class AppError extends Error {
  statusCode?: number;
}
```

**평가: ⚠️ 개선 필요**
- **문제점**:
  - 일부 라우트에서 에러 처리 일관성 부족
  - 에러 로깅은 있으나 구조화된 로깅 부족
  - 클라이언트 에러 메시지 노출 가능성

**권장 사항**:
1. 모든 라우트에서 `try-catch` 및 `next(error)` 사용
2. 프로덕션 환경에서 상세 에러 메시지 숨김
3. 구조화된 에러 코드 시스템 도입
4. 에러 모니터링 도구 연동 (예: Sentry)

---

## 4. 데이터베이스 설계 검증

### 4.1 스키마 구조
```sql
- users (세션 관리)
- admin_users (관리자)
- api_keys (AI API 키)
- curriculums (커리큘럼)
- curriculum_content (커리큘럼 내용)
- word_games (단어 게임)
- level_tests (레벨 테스트 결과)
```

**평가: ✅ 양호**
- **정규화**: 적절한 정규화 수준
- **관계**: Foreign Key로 참조 무결성 보장
- **인덱스**: 주요 쿼리 필드에 인덱스 설정

### 4.2 개선 사항
1. **소프트 삭제**: `deleted_at` 컬럼 추가 고려
2. **타임스탬프**: `updated_at` 자동 업데이트 트리거 추가
3. **데이터 검증**: CHECK 제약 조건 추가
4. **마이그레이션**: 버전 관리 시스템 강화

### 4.3 연결 풀 관리
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});
```

**평가: ✅ 적절**
- 연결 풀 크기 적절
- Azure 환경 고려한 타임아웃 설정

---

## 5. 보안 검증

### 5.1 인증 및 인가
- **관리자 인증**: JWT 기반
- **세션 관리**: UUID 기반 세션 ID

**평가: ⚠️ 개선 필요**
- **문제점**:
  1. **JWT Secret**: 하드코딩된 기본값 (`'your-secret-key'`)
  2. **세션 검증**: 클라이언트 세션 검증 부족
  3. **CORS**: 모든 origin 허용 가능성
  4. **Rate Limiting**: 없음

**권장 사항**:
1. JWT Secret을 환경 변수로 이동 (필수)
2. 세션 만료 시간 설정 및 검증
3. CORS 설정을 특정 도메인으로 제한
4. Rate Limiting 미들웨어 추가 (express-rate-limit)
5. HTTPS 강제
6. 입력 검증 강화 (express-validator)

### 5.2 데이터 보안
- **API 키 암호화**: ✅ 구현됨
- **비밀번호 해싱**: bcrypt 사용 ✅

**평가: ✅ 양호**
- API 키 암호화 구현
- 비밀번호 해싱 적절

---

## 6. 배포 구조 검증

### 6.1 Docker 구조
```
- Multi-stage build 사용
- Alpine Linux 기반 (경량화)
- 환경 변수 주입
```

**평가: ✅ 양호**
- Multi-stage build로 이미지 크기 최적화
- 환경 변수 주입 적절

### 6.2 Azure 배포
- **Container Registry**: ✅ 설정됨
- **App Service**: ✅ 설정됨
- **GitHub Actions**: ✅ CI/CD 구성

**평가: ✅ 양호**
- 자동화된 배포 파이프라인
- Docker 기반 배포

**개선 사항**:
1. Blue-Green 배포 전략 고려
2. Health Check 엔드포인트 활용
3. 롤백 전략 수립

---

## 7. 로깅 및 모니터링

### 7.1 현재 상태
```typescript
// utils/logger.ts
- 기본 로깅 구현
- 에러 로깅
```

**평가: ⚠️ 개선 필요**
- **문제점**:
  1. 구조화된 로깅 부족
  2. 로그 레벨 관리 미흡
  3. 모니터링 도구 연동 없음
  4. 성능 메트릭 수집 없음

**권장 사항**:
1. Winston 또는 Pino로 구조화된 로깅
2. 로그 레벨 환경별 설정
3. Azure Application Insights 연동
4. 성능 메트릭 수집 (응답 시간, 에러율 등)

---

## 8. 주요 개선 사항 요약

### 🔴 긴급 (Critical)
1. **JWT Secret 하드코딩 제거** - 환경 변수로 이동 필수
2. **세션 검증 강화** - 서버 사이드 세션 검증 추가
3. **에러 처리 일관성** - 모든 라우트에서 일관된 에러 처리
4. **CORS 설정 강화** - 특정 도메인으로 제한

### 🟡 중요 (Important)
1. **Rate Limiting 추가** - API 남용 방지
2. **입력 검증 강화** - express-validator 도입
3. **로깅 개선** - 구조화된 로깅 시스템
4. **모니터링 도구 연동** - Azure Application Insights

### 🟢 권장 (Recommended)
1. **상태 관리 라이브러리** - Zustand 또는 Context API
2. **API 클라이언트 개선** - 재시도, 타임아웃 로직
3. **테스트 코드 작성** - Unit, Integration 테스트
4. **문서화** - API 문서 (Swagger/OpenAPI)

---

## 9. 아키텍처 다이어그램

### 9.1 데이터 흐름
```
사용자 → Frontend (Next.js)
         ↓
      API Request
         ↓
      Backend (Express)
         ↓
   Service Layer
         ↓
   Database (PostgreSQL)
         ↓
   AI Service (Fallback)
```

### 9.2 인증 흐름
```
사용자 → Frontend
         ↓
      JWT Token (관리자)
      Session ID (일반 사용자)
         ↓
      Backend Middleware
         ↓
      인증 검증
         ↓
      라우트 접근
```

---

## 10. 결론

### 전체 평가
- **아키텍처 설계**: 8/10 - 명확한 레이어 분리, 확장 가능한 구조
- **보안**: 6/10 - 기본 보안 구현, 강화 필요
- **에러 처리**: 6.5/10 - 기본 구현, 일관성 개선 필요
- **모니터링**: 5/10 - 기본 로깅, 모니터링 도구 연동 필요
- **코드 품질**: 7.5/10 - TypeScript 사용, 구조화된 코드

### 최종 권장 사항
1. **즉시 조치**: JWT Secret 환경 변수화, CORS 설정 강화
2. **단기 개선**: Rate Limiting, 입력 검증, 에러 처리 일관성
3. **중기 개선**: 모니터링 도구 연동, 테스트 코드 작성
4. **장기 개선**: 마이크로서비스 전환 고려, 캐싱 전략 수립

---

**작성일**: 2026-01-03
**검증자**: AI 아키텍트
**버전**: 1.0
