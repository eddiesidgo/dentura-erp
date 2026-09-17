#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACK="$ROOT/back"
OUT_DIR="${1:-$ROOT/backups}"
TS="$(date +%Y%m%d-%H%M%S)"
DEST="$OUT_DIR/dentura-$TS"
mkdir -p "$DEST"

echo "Dentura backup → $DEST"

if [[ -f "$BACK/data/dentura.db" ]]; then
  cp -a "$BACK/data/dentura.db" "$DEST/dentura.db"
  echo "Copied SQLite DB"
else
  echo "No SQLite file at back/data/dentura.db (Postgres? use pg_dump separately)"
fi

if [[ -d "$BACK/data/uploads" ]]; then
  cp -a "$BACK/data/uploads" "$DEST/uploads"
  echo "Copied uploads"
fi

cat > "$DEST/README.txt" <<EOF
Dentura ERP local backup
Created: $(date -Iseconds)
Includes: SQLite DB (if present) + uploads directory.
Restore: stop the app, restore dentura.db and uploads, then restart.
EOF

echo "Done."
