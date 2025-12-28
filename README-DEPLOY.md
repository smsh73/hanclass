# 배포 및 설치 가이드

## 빠른 시작

### 1. 종속 패키지 설치

```bash
# Node.js가 설치되어 있어야 합니다
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. 로컬 데이터베이스 마이그레이션

```bash
# PostgreSQL이 실행 중이어야 합니다
cd backend
npm run migrate:dev
```

### 3. Azure 배포

```bash
# Azure CLI 로그인
az login

# 배포 스크립트 실행
chmod +x azure-deploy-simple.sh
./azure-deploy-simple.sh
```

## 상세 가이드

자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참조하세요.

