#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"

# ---- portable ISO8601 (UTC) helpers ----
iso_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
# Linux (GNU date) 優先、fallback で macOS(BSD date)
rel_utc() {
  local spec="$1"     # e.g. "-1 day" / "+7 days"
  date -u -d "$spec" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
  date -u -v"${spec/ /}" +"%Y-%m-%dT%H:%M:%SZ"
}

FROM="$(rel_utc "-15 days")"
TO="$(rel_utc "+15 days")"

echo "== casts default =="
curl -fsS "${BASE_URL}/api/casts" | jq .

echo "== casts validation NG =="
# 変なパラメータで 400 が返ることを期待。-f は使わず、ステータスで判定
tmpfile="$(mktemp)"
code=$(curl -sS -G "${BASE_URL}/api/casts" \
  --data-urlencode "page=abc" \
  -o "$tmpfile" -w "%{http_code}")
cat "$tmpfile" | jq .
if [ "$code" -ne 400 ]; then
  echo "Expected HTTP 400 but got $code"
  cat "$tmpfile"
  rm -f "$tmpfile"
  exit 1
fi
rm -f "$tmpfile"

echo "== stores keyword =="
curl -fsS -G "${BASE_URL}/api/stores" \
  --data-urlencode "keyword=中洲" | jq .

echo "== shifts range & sort =="
body=$(curl -fsS -G "${BASE_URL}/api/shifts" \
  --data-urlencode "from=${FROM}" \
  --data-urlencode "to=${TO}" \
  --data-urlencode "sort=starts_at" )
echo "$body" | jq .

# 最低限の健全性チェック（total>=1 を期待）
total=$(echo "$body" | jq -r '.total // 0')
if [ "$total" -lt 1 ]; then
  echo "Expected shifts.total >= 1 but got $total"
  exit 1
fi

# 代表 cast の名前展開チェック（存在すればOK）
cast_id=$(curl -fsS "${BASE_URL}/api/casts" | jq -r '.items[0].id')
if [ "$cast_id" != "null" ] && [ -n "$cast_id" ]; then
  echo "== shifts expand=names =="
  curl -fsS -G "${BASE_URL}/api/shifts" \
    --data-urlencode "cast_id=${cast_id}" \
    --data-urlencode "expand=names" | jq .
fi

echo "✅ smoke tests passed"
