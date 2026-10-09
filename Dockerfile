# Stage 1: Dependencies (using slim Debian with precompiled glibc binaries to avoid CPU compile spikes)
FROM node:22-slim AS deps
WORKDIR /app

# Copy dependency definitions
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/prisma ./prisma/

# Install with low memory footprint and disable unnecessary scripts/audits
ENV NODE_OPTIONS="--max-old-space-size=768"
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Stage 2: Builder
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# Production build envs - RESTRICT TO 1 CPU CORE AND 768MB RAM TO PREVENT VPS CRASH
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sportsurge"
ENV BACKEND_URL="https://backend.sportsurgeplay.com"
ENV NEXT_CPU_COUNT=1
ENV NODE_OPTIONS="--max-old-space-size=768"

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public directory and standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
