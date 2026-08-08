#!/bin/sh
# Doprowadza bazę do aktualnego stanu, zanim wystartuje serwer.
# migrate deploy jest idempotentne, więc restart kontenera jest bezpieczny.
set -e

echo "Applying database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

# Seed tylko przy pustym katalogu produktów. Skrypt czyści tabele przed zapisem,
# więc bezwarunkowe uruchamianie go przy każdym starcie kasowałoby dane
# wprowadzone przez użytkownika.
if [ "${RUN_SEED}" = "true" ]; then
  NEEDS_SEED=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    db.product.count()
      .then((n) => { console.log(n === 0 ? 'yes' : 'no'); })
      .catch(() => { console.log('yes'); })
      .finally(() => db.\$disconnect());
  ")

  if [ "$NEEDS_SEED" = "yes" ]; then
    echo "Seeding database..."
    node seed-dist/seed.js
  else
    echo "Seed skipped: catalogue is not empty."
  fi
fi

exec "$@"
