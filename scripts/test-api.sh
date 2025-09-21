#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:3000}
jq --version >/dev/null

echo "== casts default =="
curl -s "${BASE}/api/casts" | jq -e '.ok == true' >/dev/null

echo "== casts validation NG =="
code=$(curl -s "${BASE}/api/casts?limit=9999" | jq -r '.code // empty')
test "$code" = "VALIDATION_ERROR"

echo "== stores keyword =="
curl -sG "${BASE}/api/stores" --data-urlencode "keyword=中洲" | jq -e '.ok == true' >/dev/null

echo "== shifts range & sort =="
FROM=$(date -v-15d -Iseconds 2>/dev/null || date -d "15 days ago" -Iseconds)
TO=$(date -v+15d -Iseconds 2>/dev/null || date -d "15 days" -Iseconds)
curl -sG "${BASE}/api/shifts" --data-urlencode "from=$FROM" --data-urlencode "to=$TO" --data-urlencode "sort=starts_at" | jq -e '.ok == true' >/dev/null

echo "All green ✅"
