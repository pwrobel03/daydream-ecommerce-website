#!/usr/bin/env bash
# Podnosi zależności E2E, wypycha schemat, seeduje i uruchamia Playwrighta.
set -euo pipefail

# E2E_PORT_BASE (opcjonalne): aplikacja = base, Postgres = +1, Redis = +2, SMTP = +3, UI Mailpit = +4.
# Układ musi być zgodny z playwright.config.ts.
if [ -n "${E2E_PORT_BASE:-}" ]; then
  export E2E_POSTGRES_PORT=$((E2E_PORT_BASE + 1)) E2E_REDIS_PORT=$((E2E_PORT_BASE + 2))
  export E2E_SMTP_PORT=$((E2E_PORT_BASE + 3)) E2E_MAILPIT_PORT=$((E2E_PORT_BASE + 4))
fi

export DATABASE_URL="postgresql://daydream:daydream@localhost:${E2E_POSTGRES_PORT:-55432}/daydream_e2e"

cleanup() { docker compose -p "${COMPOSE_PROJECT_NAME:-daydream-e2e}" -f docker-compose.test.yml down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker compose -p "${COMPOSE_PROJECT_NAME:-daydream-e2e}" -f docker-compose.test.yml up -d --wait

npx prisma migrate deploy
npx tsx tests/e2e/seed.ts

npx playwright test "$@"
