#!/usr/bin/env bash
# Podnosi zależności E2E, wypycha schemat, seeduje i uruchamia Playwrighta.
set -euo pipefail

export DATABASE_URL="postgresql://daydream:daydream@localhost:55432/daydream_e2e"

cleanup() { docker compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker compose -f docker-compose.test.yml up -d --wait

npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' tests/e2e/seed.ts

npx playwright test "$@"
