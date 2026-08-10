#!/bin/sh
# Uruchamiane jako osobna usługa przed startem aplikacji.
# Ma pełne node_modules, więc CLI Prismy działa tu bez doinstalowywania
# zależności do obrazu produkcyjnego.
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

# Seed tylko przy pustym katalogu produktów — skrypt czyści tabele przed
# zapisem, więc bezwarunkowe uruchamianie kasowałoby dane z panelu.
if [ "${RUN_SEED}" = "true" ]; then
  NEEDS_SEED=$(npx tsx docker/needs-seed.ts)

  if [ "$NEEDS_SEED" = "yes" ]; then
    echo "Seeding database..."
    npx tsx prisma/seed.ts
  else
    echo "Seed skipped: catalogue is not empty."
  fi
fi

echo "Database ready."
