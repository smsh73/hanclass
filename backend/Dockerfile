FROM node:20-alpine

# 한글 인코딩 지원
ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

WORKDIR /app

# 패키지 파일 복사 및 설치 (devDependencies 포함 - 빌드에 필요)
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 마이그레이션 파일을 dist에도 복사 (빌드 후에도 접근 가능하도록)
RUN mkdir -p dist/database/migrations && \
    (cp -r src/database/migrations/*.sql dist/database/migrations/ 2>/dev/null || true) && \
    (cp -r database/migrations/*.sql dist/database/migrations/ 2>/dev/null || true)

# 프로덕션 의존성만 다시 설치 (이미지 크기 최적화)
RUN npm prune --production

# 포트 노출 (Azure App Service는 PORT 환경 변수를 자동 설정)
EXPOSE 8080

# Azure App Service를 위한 환경 변수 설정
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

# 마이그레이션 및 애플리케이션 실행 (마이그레이션 실패해도 애플리케이션 시작)
CMD sh -c "npm run migrate || echo 'Migration failed, continuing...' && node dist/index.js"

