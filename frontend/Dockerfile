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
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# standalone 디렉토리 복사 (있으면)
RUN --mount=from=builder,source=/app/.next/standalone,target=/tmp/standalone \
    if [ -d /tmp/standalone ]; then \
      cp -r /tmp/standalone/* ./ && \
      echo "Standalone build copied"; \
    else \
      echo "No standalone build, copying server files"; \
      mkdir -p .next/server && \
      cp -r /app/.next/server/* .next/server/ 2>/dev/null || true; \
    fi

# standalone이 없으면 필요한 파일 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/server ./.next/server
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# standalone이 있으면 server.js 사용, 없으면 next start 사용
CMD ["sh", "-c", "if [ -f server.js ]; then echo 'Starting standalone server...' && node server.js; else echo 'Starting Next.js server...' && npm start; fi"]

