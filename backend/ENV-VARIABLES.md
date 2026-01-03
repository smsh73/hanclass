# 환경 변수 설정 가이드

## 필수 환경 변수

### 데이터베이스
```bash
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=hanclass
DB_USER=your-database-user
DB_PASSWORD=your-database-password
AZURE_DB=true  # Azure Database 사용 시
```

### 인증 및 보안
```bash
# ⚠️ 필수: JWT Secret은 반드시 강력한 랜덤 문자열로 설정해야 함
JWT_SECRET=your-very-strong-random-secret-key-minimum-32-characters

# API 키 암호화용 키 (32자 이상)
ENCRYPTION_KEY=your-encryption-key-32-characters-long

# 프론트엔드 URL (쉼표로 구분하여 여러 도메인 허용 가능)
FRONTEND_URL=https://hanclass-frontend.azurewebsites.net,http://localhost:3000
```

### 로깅
```bash
# 로그 레벨: error, warn, info, debug
LOG_LEVEL=info  # 프로덕션: info, 개발: debug
```

## 선택적 환경 변수

### AI API 키 (관리자 페이지에서 설정 가능)
```bash
# 환경 변수로도 설정 가능 (관리자 페이지 설정이 우선)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

### 서버 설정
```bash
PORT=8080  # Azure App Service는 자동 설정
HOSTNAME=0.0.0.0  # Azure App Service는 자동 설정
NODE_ENV=production
```

## Azure App Service 설정 방법

1. Azure Portal 접속
2. App Service 선택
3. Configuration > Application settings
4. New application setting 추가
5. 각 환경 변수 추가

## 보안 주의사항

⚠️ **중요**: 
- `JWT_SECRET`은 반드시 강력한 랜덤 문자열로 설정
- 최소 32자 이상 권장
- 프로덕션 환경에서는 절대 하드코딩하지 말 것
- Git에 커밋하지 말 것 (`.env` 파일은 `.gitignore`에 포함)

## 환경 변수 생성 예시

```bash
# JWT Secret 생성 (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
