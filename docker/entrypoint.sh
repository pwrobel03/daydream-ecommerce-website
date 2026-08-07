#!/bin/sh
# Doprowadza bazę do aktualnego stanu, zanim wystartuje serwer.
# migrate deploy jest idempotentne, więc restart kontenera jest bezpieczny.
set -e

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding database..."
  node prisma/seed.js 2>/dev/null || echo "Seed skipped (no compiled seed in image)"
fi

exec "$@"
