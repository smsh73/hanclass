# 한글학당 (HANCLASS)

말레이시아인을 위한 AI 기반 한국어 학습 플랫폼

## 기능

- **레벨 테스트**: 초급/중급/고급 레벨 평가
- **주제별 자유 대화**: AI와 음성으로 한국어 대화 연습
- **단어 맞추기 게임**: 음성 인식 기반 단어 학습 게임
- **커리큘럼 관리**: PDF/Word 교안 업로드로 자동 커리큘럼 생성

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI, Claude, Gemini (Fallback 지원)
- **Deployment**: Azure App Service, Azure Container Registry

## 배포 상태

- ✅ 백엔드: https://hanclass-backend.azurewebsites.net
- ⚠️ 프론트엔드: 배포 진행 중

## 로컬 개발

### 백엔드
```bash
cd backend
npm install
npm run dev
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## 환경 변수

### 백엔드
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `FRONTEND_URL`

### 프론트엔드
- `NEXT_PUBLIC_API_URL`

## 라이선스

MIT
