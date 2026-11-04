#!/usr/bin/env bash
# The production database to the local one (`pnpm payload:db:sync`) – over
# SSH, the database itself is not reachable from outside.
#
# Dumps into a temp file first, so a failed or aborted remote dump shows in
# the exit code, and restores only a plausible dump – otherwise the local
# database stays untouched. A streaming `ssh … | mongorestore --drop` would
# swallow the dump's exit code and could drop the local data half-way.
#
# Needs: the server's SSH host alias (SYNC_REMOTE in .env) and the local
# MongoDB from docker-compose.dev.yml running.
set -euo pipefail

# The server's SSH host alias: SYNC_REMOTE from the environment or the local
# .env (never in the repo).
if [ -z "${SYNC_REMOTE:-}" ] && [ -f .env ]; then
  SYNC_REMOTE="$(grep -E '^SYNC_REMOTE=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"'')"
fi
if [ -z "${SYNC_REMOTE:-}" ]; then
  echo "✗ SYNC_REMOTE is not set – the server's SSH host alias, in .env." >&2
  exit 1
fi
REMOTE="$SYNC_REMOTE"
DEV_COMPOSE="${DB_SYNC_DEV_COMPOSE:-docker-compose.dev.yml}"

tmp="$(mktemp -t ppp-dump.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

echo "→ Dumping the production database …"
ssh "$REMOTE" 'cd /opt/apps/ppp && docker compose exec -T mongo mongodump --archive --gzip --db ppp' > "$tmp"

size=$(wc -c < "$tmp")
if [ "$size" -lt 1000 ]; then
  echo "✗ Dump empty or too small (${size} B) – remote error? Stopped, local database untouched." >&2
  exit 1
fi

echo "→ Dump OK (${size} B). Restoring into the local database (--drop) …"
docker compose -f "$DEV_COMPOSE" exec -T mongo mongorestore --archive --gzip --drop < "$tmp"

# Nothing to revalidate: the pages read the database on every request.
echo "✓ Database synced."
