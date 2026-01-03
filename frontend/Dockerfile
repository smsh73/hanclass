FROM node:20-alpine AS base

# 한글 인코딩 지원
ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js with standalone output
# ARG는 빌드 타임에만 사용 가능, ENV는 런타임에도 사용 가능
ARG NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 빌드 시 환경 변수 확인
RUN echo "=== Building with NEXT_PUBLIC_API_URL ===" && \
    echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" && \
    echo "This value will be embedded in the Next.js build"

# 디버깅: 파일 구조 확인
RUN echo "=== 파일 구조 확인 ===" && \
    ls -la && \
    echo "=== 타입 파일 확인 ===" && \
    find . -name "*.d.ts" -type f && \
    echo "=== TypeScript 파일 확인 ===" && \
    find . -name "*.ts" -o -name "*.tsx" | head -20

# 빌드 실행 (자세한 로그 출력)
RUN npm run build 2>&1 | tee build.log || (echo "=== 빌드 실패 ===" && echo "=== 빌드 로그 ===" && cat build.log && echo "=== .next 디렉토리 확인 ===" && ls -la .next/ 2>/dev/null || echo ".next 디렉토리 없음" && echo "=== package.json 확인 ===" && cat package.json && exit 1)

# 빌드 후 BUILD_ID 확인 및 생성 (필수)
RUN echo "=== 빌드 후 BUILD_ID 확인 ===" && \
    if [ ! -f ".next/BUILD_ID" ]; then \
      echo "WARNING: BUILD_ID가 없습니다. 빌드 로그 확인 중..." && \
      tail -100 build.log 2>/dev/null | grep -i "error\|fail\|warn" | head -20 || echo "빌드 로그에서 오류를 찾을 수 없음" && \
      echo "=== .next 디렉토리 전체 구조 ===" && \
      find .next -type f -name "*.js" -o -name "*.json" | head -20 && \
      echo "=== BUILD_ID 수동 생성 시도 ===" && \
      if [ -d ".next" ]; then \
        echo "$(date +%s)" > .next/BUILD_ID && \
        echo "✓ BUILD_ID 수동 생성 완료: $(cat .next/BUILD_ID)" || \
        (echo "ERROR: BUILD_ID 생성 실패" && exit 1); \
      else \
        echo "ERROR: .next 디렉토리가 없습니다!" && exit 1; \
      fi; \
    else \
      echo "✓ BUILD_ID found: $(cat .next/BUILD_ID)"; \
    fi

# 빌드 결과 확인 (BUILD_ID 및 standalone 확인)
RUN echo "=== 빌드 결과 확인 ===" && \
    echo "=== .next 디렉토리 존재 확인 ===" && \
    if [ ! -d ".next" ]; then \
      echo "ERROR: .next 디렉토리가 없습니다!" && exit 1; \
    else \
      echo "✓ .next 디렉토리 존재"; \
    fi && \
    echo "=== .next 디렉토리 전체 내용 ===" && \
    ls -la .next/ && \
    echo "=== BUILD_ID 확인 ===" && \
    if [ ! -f ".next/BUILD_ID" ]; then \
      echo "WARNING: BUILD_ID 파일이 없습니다. 빌드 로그를 확인하세요." && \
      echo "=== 빌드 로그 마지막 50줄 ===" && \
      tail -50 build.log 2>/dev/null || echo "빌드 로그 파일 없음"; \
    else \
      echo "✓ BUILD_ID found: $(cat .next/BUILD_ID)"; \
    fi && \
    echo "=== standalone 빌드 확인 ===" && \
    if [ ! -d ".next/standalone" ]; then \
      echo "WARNING: .next/standalone 디렉토리가 없습니다. 일반 빌드 모드로 전환합니다." && \
      echo "=== .next/server 디렉토리 확인 ===" && \
      ls -la .next/server 2>/dev/null || echo ".next/server 디렉토리 없음"; \
    else \
      echo "✓ standalone 빌드 성공"; \
      echo "=== standalone 디렉토리 내용 ===" && \
      ls -la .next/standalone/ | head -10 && \
      if [ -f ".next/standalone/server.js" ]; then \
        echo "✓ standalone/server.js found"; \
      else \
        echo "⚠ standalone/server.js not found"; \
        echo "=== standalone 디렉토리 전체 내용 ===" && \
        find .next/standalone -type f | head -20; \
      fi; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# public 디렉토리는 선택적 (없어도 빌드 진행)
RUN mkdir -p ./public
# public 디렉토리 복사 시도 (없으면 빈 디렉토리 유지)
RUN --mount=from=builder,source=/app/public,target=/tmp/public \
    if [ -d "/tmp/public" ] && [ -n "$(find /tmp/public -mindepth 1 -maxdepth 1 2>/dev/null | head -1)" ]; then \
      cp -r /tmp/public/. ./public/ 2>/dev/null || true && \
      echo "✓ Public directory copied"; \
    else \
      echo "⚠ Public directory not found or empty, using empty directory"; \
    fi
# .next 디렉토리 전체 복사 (BUILD_ID 포함, production 빌드에 필수)
# 먼저 .next 디렉토리 생성
RUN mkdir -p ./.next

# .next 디렉토리 전체 복사 (BUILD_ID, static, server 등 모든 파일)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# startup.sh 복사 (Azure App Service가 자동 실행할 수 있으므로 반드시 필요)
# Docker 환경에서는 server.js가 이미 존재하므로 startup.sh가 자동 감지하여 빌드 건너뛰기
RUN --mount=from=builder,source=/app/startup.sh,target=/tmp/startup.sh \
    if [ -f /tmp/startup.sh ]; then \
      cp /tmp/startup.sh ./startup.sh && \
      chmod +x ./startup.sh && \
      chown nextjs:nodejs ./startup.sh && \
      echo "✓ startup.sh copied (will auto-detect Docker and skip build)"; \
    else \
      echo "⚠ startup.sh not found in builder, creating minimal version"; \
      echo '#!/bin/sh' > ./startup.sh && \
      echo 'if [ -f "server.js" ] || [ -f "/app/server.js" ]; then' >> ./startup.sh && \
      echo '  echo "=== Docker Container Detected ==="' >> ./startup.sh && \
      echo '  echo "Server.js already exists, starting directly..."' >> ./startup.sh && \
      echo '  if [ -f "server.js" ]; then exec node server.js; fi' >> ./startup.sh && \
      echo '  if [ -f "/app/server.js" ]; then cd /app && exec node server.js; fi' >> ./startup.sh && \
      echo '  exit 0' >> ./startup.sh && \
      echo 'fi' >> ./startup.sh && \
      echo 'echo "Azure App Service ZIP deployment - build required"' >> ./startup.sh && \
      chmod +x ./startup.sh && \
      chown nextjs:nodejs ./startup.sh && \
      echo "✓ Minimal startup.sh created"; \
    fi

# node_modules와 package.json 복사
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# package-lock.json은 선택적 파일이므로 복사하지 않음 (없어도 정상 작동)

# 빌드 파일 확인 및 standalone 빌드 처리
RUN echo "=== Checking build files ===" && \
    if [ -f ".next/BUILD_ID" ]; then \
      echo "✓ BUILD_ID found: $(cat .next/BUILD_ID)"; \
    else \
      echo "⚠ BUILD_ID not found in .next"; \
      echo "=== .next directory contents ===" && \
      ls -la .next/ 2>/dev/null | head -10; \
    fi && \
    if [ -d ".next/standalone" ] && [ -n "$(find .next/standalone -mindepth 1 -maxdepth 1 2>/dev/null | head -1)" ]; then \
      echo "✓ Standalone build found, will be used if server.js exists"; \
    else \
      echo "⚠ Standalone build not found, will use standard build from .next"; \
    fi

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 직접 실행
# 단순하고 확실한 서버 시작 로직
CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f .next/standalone/server.js ]; then cd .next/standalone && if [ -d ../static ] && [ ! -d .next/static ]; then mkdir -p .next && cp -r ../static .next/static 2>/dev/null || true; fi && if [ -d ../../public ] && [ ! -d public ]; then cp -r ../../public ./public 2>/dev/null || true; fi && node server.js; else npm start; fi"]

