#!/usr/bin/env bash
# Usage: capture.sh <tree> <out-dir>
# Installs, migrates, seeds, builds and serves one checkout, then captures every route in
# tests/screenshots/routes.ts into <out-dir>. Needs the environment of screenshots.yml.
set -euo pipefail

tree="$1"; out="$2"
cd "$tree"

npm ci --no-audit --no-fund
# After npm ci: the browser build must match this tree's Playwright version.
npx playwright install --with-deps chromium
npx prisma generate
# Start from an empty schema: the base branch may have different migrations.
echo "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" | npx prisma db execute --stdin
npx prisma migrate deploy
npx tsx tests/e2e/seed.ts
npm run build

npx next start --port "${PORT:-3000}" &
server=$!
trap 'kill $server 2>/dev/null || true' EXIT
curl --silent --fail --retry 60 --retry-delay 2 --retry-connrefused -o /dev/null "http://localhost:${PORT:-3000}/api/health"

SCREENSHOT_BASE_URL="http://localhost:${PORT:-3000}" SCREENSHOT_DIR="$out" npx playwright test --config playwright.screenshots.config.ts
