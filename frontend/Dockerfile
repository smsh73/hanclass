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
RUN npm run build || (echo "=== 빌드 실패 ===" && cat .next/trace 2>/dev/null || true && exit 1)

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

