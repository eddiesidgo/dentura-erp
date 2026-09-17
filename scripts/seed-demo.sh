#!/usr/bin/env bash
# Carga data DEMO bajo demanda (NO corre con Flyway / migraciones).
# Requiere API arrancada con: DENTURA_DEMO_SEED_ENABLED=true
#
# Uso:
#   ./scripts/seed-demo.sh
#   ./scripts/seed-demo.sh http://localhost:8080 admin 123Qwe

set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
USER="${2:-admin}"
PASS="${3:-123Qwe}"

echo "==> Sign-in as ${USER}"
TOKEN=$(curl -s -X POST "${BASE_URL}/api/sign-in" \
  -H 'Content-Type: application/json' \
  -d "{\"userName\":\"${USER}\",\"password\":\"${PASS}\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

echo "==> Demo status"
STATUS=$(curl -s "${BASE_URL}/api/demo/status" -H "Authorization: Bearer ${TOKEN}")
echo "$STATUS" | python3 -m json.tool

if echo "$STATUS" | grep -q '"seedEnabled": false'; then
  echo ""
  echo "ERROR: demo seed deshabilitado."
  echo "Reinicia el API con: export DENTURA_DEMO_SEED_ENABLED=true"
  exit 1
fi

echo "==> POST /api/demo/seed"
curl -s -X POST "${BASE_URL}/api/demo/seed" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -m json.tool

echo ""
echo "Listo. En el front busca pacientes DEMO-001 / DEMO-002 / DEMO-003"
echo "y abre la pestaña Diseño 3D (scans + smile designs)."
