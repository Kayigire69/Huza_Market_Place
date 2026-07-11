#!/usr/bin/env bash
# Daily PostgreSQL backup for HUZA FRESH
# Usage: ./scripts/backup-db.sh
# Cron example (daily 2am): 0 2 * * * /path/to/Huza_Market_Place/scripts/backup-db.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/huza_$STAMP.sql.gz"

echo "Backing up to $OUT"
pg_dump "$DATABASE_URL" | gzip > "$OUT"

# Keep last 14 days
find "$BACKUP_DIR" -name 'huza_*.sql.gz' -mtime +14 -delete 2>/dev/null || true
echo "Done."
