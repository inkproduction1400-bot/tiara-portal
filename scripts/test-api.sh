# scripts/test-api.sh
#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${1:-http://localhost:3000}

echo "[health]"
curl -fsS "$BASE_URL/api/health" | jq -r .ok

echo "[casts]"
curl -fsS "$BASE_URL/api/casts?limit=5" | jq '.data | length'

echo "[shifts]"
curl -fsS "$BASE_URL/api/shifts?limit=5" | jq '.data | length'

echo "OK"
