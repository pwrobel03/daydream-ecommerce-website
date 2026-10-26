#!/usr/bin/env bash
# Demo reset (ADR 0010): previews what will be deleted, dumps the database and the uploads,
# waits for a typed RESET and only then restores the seed state. Run in the deployment directory:
#
#   scripts/demo-reset.sh
#
# There is deliberately no option to skip the confirmation, and it refuses to run without a terminal.
#
# Variables (optional):
#   DEPLOY_COMPOSE_FILES  space-separated compose files (default: "docker-compose.yml docker-compose.prod.yml")
#   DEPLOY_ENV_FILE       env file for Compose (default: .env.docker)
set -euo pipefail

[ $# -eq 0 ] || { echo "Usage: $0 (takes no arguments)" >&2; exit 2; }
[ -t 0 ] || { echo "demo-reset.sh needs a terminal: it asks for a typed confirmation." >&2; exit 1; }

compose=(docker compose --env-file "${DEPLOY_ENV_FILE:-.env.docker}")
for file in ${DEPLOY_COMPOSE_FILES:-docker-compose.yml docker-compose.prod.yml}; do
  compose+=(-f "$file")
done

# Every container call reads /dev/null, or it would swallow the owner's typed answer.
migrate=("${compose[@]}" run --rm -T migrate)

echo "== Preview: what the reset will delete =="
"${migrate[@]}" npx tsx scripts/demo-reset.ts --preview </dev/null

umask 077
mkdir -p backups
chmod 700 backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
dump="backups/pre-reset-$stamp.dump"
uploads="backups/pre-reset-$stamp-uploads.tar.gz"

echo "== Dumping the database to $dump =="
"${compose[@]}" exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' </dev/null > "$dump"
[ -s "$dump" ] || { echo "The dump is empty; nothing was deleted." >&2; exit 1; }

echo "== Archiving the uploads to $uploads =="
"${migrate[@]}" tar -czf - -C /data/uploads . </dev/null > "$uploads"
[ -s "$uploads" ] || { echo "The uploads archive is empty; nothing was deleted." >&2; exit 1; }

read -rp "Type RESET to delete the data listed above: " answer
[ "$answer" = "RESET" ] || { echo "Aborted; nothing was deleted. The dumps stay in backups/." >&2; exit 1; }

"${migrate[@]}" npx tsx scripts/demo-reset.ts --apply </dev/null
echo "Reset done. Pre-reset dump: $dump (uploads: $uploads)"
