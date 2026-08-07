# syntax=docker/dockerfile:1

# --- Zależności -------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

# lib/env.ts waliduje konfigurację przy imporcie, a `next build` importuje kod
# aplikacji. Wartości poniżej istnieją wyłącznie po to, żeby build przeszedł —
# w runtime są nadpisywane tymi z compose i nigdzie nie trafiają do obrazu.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    UPLOAD_DIR="/data/uploads" \
    REDIS_URL="redis://localhost:6379" \
    AUTH_SECRET="build-time-placeholder" \
    AUTH_GOOGLE_ID="build" AUTH_GOOGLE_SECRET="build" \
    AUTH_GITHUB_ID="build" AUTH_GITHUB_SECRET="build" \
    STRIPE_SECRET_KEY="sk_test_build" \
    STRIPE_WEBHOOK_SECRET="whsec_build" \
    RESEND_API_KEY="re_build" \
    MAILING_ACCOUNT="build@example.com" \
    MAILING_ACCOUNT_PROVIDER="onboarding@resend.dev" \
    CRON_SECRET="build-time-cron-placeholder" \
    NEXT_PUBLIC_APP_URL="http://localhost:3000" \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Runtime ----------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# Proces nie ma powodu działać jako root.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Wyjście standalone niesie własny, minimalny node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma CLI i schemat są potrzebne, żeby kontener sam wykonał `migrate deploy`.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Katalog uploadu jest montowany jako wolumen; tworzymy go z właściwym właścicielem,
# żeby proces bez roota mógł do niego pisać.
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /data

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
