# 한국어학당 AI 인터랙티브 학습 서비스

말레이시아인을 위한 한국어 학습 플랫폼입니다.

## 기술 스택

- **프론트엔드**: Next.js 14, React, TypeScript, Tailwind CSS
- **백엔드**: Node.js, Express, TypeScript
- **데이터베이스**: PostgreSQL
- **음성 인식**: Web Speech API + OpenAI Whisper
- **음성 합성**: Google Text-to-Speech
- **AI API**: OpenAI, Claude, Gemini (Fallback 지원)

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- Docker (선택사항)

### 설치

1. 의존성 설치:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

2. 데이터베이스 설정:
```bash
# Docker를 사용하는 경우
docker-compose up -d

# 또는 직접 PostgreSQL 설정
```

3. 환경 변수 설정:
```bash
# Backend
cp backend/.env.example backend/.env
# 환경 변수 수정

# Frontend
cp frontend/.env.example frontend/.env.local
```

4. 데이터베이스 마이그레이션:
```bash
cd backend
npm run migrate
```

5. 개발 서버 실행:
```bash
# Backend
npm run dev:backend

# Frontend (새 터미널)
npm run dev:frontend
```

## 프로젝트 구조

```
hanclass/
├── frontend/          # Next.js 프론트엔드
├── backend/           # Node.js 백엔드
├── database/          # 데이터베이스 마이그레이션
└── docker-compose.yml # 로컬 개발용 Docker 설정
```

## 주요 기능

- 레벨 테스트
- 주제별 AI 자유 인터랙티브 대화 학습
- 단어 맞추기 게임
- 교안 업로드 및 커리큘럼 생성
- 관리자 페이지

## 배포

Azure App Service 및 Azure Container Registry를 사용하여 배포합니다.

