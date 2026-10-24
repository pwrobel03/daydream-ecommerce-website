#!/usr/bin/env bash
# Creates the private admin, or resets its password. Run in the deployment directory:
#
#   scripts/create-admin.sh <email> [name]
#
# The password is typed twice (not echoed) and piped on standard input to
# scripts/create-admin.ts in the migrator. It lives only in an unexported shell variable:
# never an argument, an environment variable, shell history or a file.
#
# Variables (optional):
#   DEPLOY_COMPOSE_FILES  space-separated compose files (default: "docker-compose.yml docker-compose.prod.yml")
#   DEPLOY_ENV_FILE       env file for Compose (default: .env.docker)
set -euo pipefail
set +x # the secret must never reach xtrace output, even under `bash -x`

[ $# -ge 1 ] && [ $# -le 2 ] || { echo "Usage: $0 <email> [name]" >&2; exit 2; }

compose=(docker compose --env-file "${DEPLOY_ENV_FILE:-.env.docker}")
for file in ${DEPLOY_COMPOSE_FILES:-docker-compose.yml docker-compose.prod.yml}; do
  compose+=(-f "$file")
done

IFS= read -rsp "Password for $1: " secret; echo >&2
IFS= read -rsp "Repeat the password: " repeat; echo >&2
[ "$secret" = "$repeat" ] || { echo "The passwords differ." >&2; exit 1; }

# printf is a shell builtin, so the value is not visible in the process list.
printf '%s\n' "$secret" | "${compose[@]}" run --rm -T migrate npx tsx scripts/create-admin.ts "$@"
