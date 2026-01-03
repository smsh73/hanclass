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
ARG NEXT_PUBLIC_API_URL=https://hanclass-backend.azurewebsites.net
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 디버깅: 파일 구조 확인
RUN echo "=== 파일 구조 확인 ===" && \
    ls -la && \
    echo "=== 타입 파일 확인 ===" && \
    find . -name "*.d.ts" -type f && \
    echo "=== TypeScript 파일 확인 ===" && \
    find . -name "*.ts" -o -name "*.tsx" | head -20

# 빌드 실행 (자세한 로그 출력)
RUN npm run build 2>&1 | tee build.log || (echo "=== 빌드 실패 ===" && echo "=== 빌드 로그 ===" && cat build.log && echo "=== .next 디렉토리 확인 ===" && ls -la .next/ 2>/dev/null || echo ".next 디렉토리 없음" && echo "=== package.json 확인 ===" && cat package.json && exit 1)

# 빌드 결과 확인 (standalone이 없으면 일반 빌드 사용)
RUN echo "=== 빌드 결과 확인 ===" && \
    if [ ! -d ".next" ]; then \
      echo "ERROR: .next 디렉토리가 없습니다!" && exit 1; \
    fi && \
    if [ ! -d ".next/standalone" ]; then \
      echo "WARNING: .next/standalone 디렉토리가 없습니다. 일반 빌드 모드로 전환합니다." && \
      echo "=== .next 디렉토리 내용 ===" && ls -la .next/; \
    else \
      echo "✓ standalone 빌드 성공"; \
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
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy startup.sh if it exists (for Azure App Service)
# Note: Docker 컨테이너에서는 CMD를 사용하므로 startup.sh는 선택사항
RUN --mount=from=builder,source=/app/startup.sh,target=/tmp/startup.sh \
    if [ -f /tmp/startup.sh ]; then \
      cp /tmp/startup.sh ./startup.sh && \
      chmod +x ./startup.sh && \
      chown nextjs:nodejs ./startup.sh && \
      echo "✓ startup.sh copied and made executable"; \
    else \
      echo "⚠ startup.sh not found, using CMD"; \
    fi

# 먼저 일반 빌드 파일 복사 (항상 필요)
COPY --from=builder --chown=nextjs:nodejs /app/.next/server ./.next/server
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# standalone 디렉토리 복사 시도 (있으면 덮어쓰기)
# 빌더에서 standalone 존재 여부 확인 후 복사
RUN --mount=from=builder,source=/app/.next,target=/tmp/next \
    if [ -d "/tmp/next/standalone" ] && [ -n "$(find /tmp/next/standalone -mindepth 1 -maxdepth 1 2>/dev/null | head -1)" ]; then \
      cp -r /tmp/next/standalone/. ./ 2>/dev/null || true && \
      echo "✓ Standalone build copied successfully"; \
    else \
      echo "⚠ Standalone build not found, using standard build"; \
    fi

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Docker 컨테이너에서는 이미 빌드가 완료되어 있으므로 직접 실행
# 우선순위: server.js > .next/standalone/server.js > npm start
CMD ["sh", "-c", "if [ -f server.js ]; then echo 'Starting standalone server from root...' && node server.js; elif [ -f .next/standalone/server.js ]; then echo 'Starting standalone server from .next/standalone...' && node .next/standalone/server.js; else echo 'Starting Next.js server...' && npm run start:next; fi"]

