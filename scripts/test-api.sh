#!/usr/bin/env bash
set -euo pipefail

# BASE_URL を環境変数で上書き可能に（例：BASE_URL=http://localhost:3001 npm run test:api）
BASE_URL="${BASE_URL:-http://localhost:3000}"

# ---- portable ISO8601 (UTC) helpers ----
iso_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# Linux(GNU) 優先、ダメなら macOS(BSD) 用に "+10 hours" -> "-v+10H" に変換して実行
rel_utc() {
  local spec="$1"     # 例: "-15 days" / "+10 hours" / "+4 hours"
  if date -u -d "$spec" +"%Y-%m-%dT%H:%M:%SZ" >/dev/null 2>&1; then
    date -u -d "$spec" +"%Y-%m-%dT%H:%M:%SZ"
    return
  fi
  # BSD date 変換
  local sign num unit bsd_unit
  sign="${spec%% *}"           # "+10" or "-15"
  unit="${spec#* }"            # "hours" / "days" など
  num="${sign#[-+]}"           # "10" / "15"
  sign="${sign:0:1}"           # "+" / "-"
  case "$unit" in
    day|days)       bsd_unit="d" ;;
    hour|hours)     bsd_unit="H" ;;
    minute|minutes) bsd_unit="M" ;;
    second|seconds) bsd_unit="S" ;;
    week|weeks)     bsd_unit="w" ;;
    month|months)   bsd_unit="m" ;;
    year|years)     bsd_unit="y" ;;
    *) echo "Unsupported unit: $unit" >&2; return 1 ;;
  esac
  date -u -v"${sign}${num}${bsd_unit}" +"%Y-%m-%dT%H:%M:%SZ"
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

# storesの先頭を取得（Casts/ShiftsのPOSTに利用）
first_store=$(curl -fsS "${BASE_URL}/api/stores" | jq -r '.items[0].id')
if [ -z "${first_store}" ] || [ "${first_store}" = "null" ]; then
  echo "No store found. Aborting."
  exit 1
fi

# ---------------------------
# 回帰検知: Casts POST -> 409 -> PATCH -> 404
# ---------------------------
echo "== casts POST/PATCH smoke =="

unique_name="__smoke_cast__$(date -u +%s)"
cast_post_payload=$(cat <<JSON
{
  "store_id":"${first_store}",
  "name":"${unique_name}",
  "nickname":"Smoke",
  "wage":2000,
  "rating":4.0,
  "genre":["レギュラー"],
  "drinkable":true,
  "owner":"Tiara"
}
JSON
)

# POST /api/casts
cast_post_resp=$(curl -sS -X POST "${BASE_URL}/api/casts" \
  -H "Content-Type: application/json" \
  -d "${cast_post_payload}")
echo "$cast_post_resp" | jq .
new_cast_id=$(echo "$cast_post_resp" | jq -r '.item.id')
if [ -z "$new_cast_id" ] || [ "$new_cast_id" = "null" ]; then
  echo "POST /api/casts did not return item.id"
  exit 1
fi

# 重複（同store_id+name）で 409 を期待
dup_code=$(curl -s -X POST "${BASE_URL}/api/casts" \
  -H "Content-Type: application/json" \
  -d "{\"store_id\":\"${first_store}\",\"name\":\"${unique_name}\"}" \
  -o /dev/null -w "%{http_code}")
if [ "$dup_code" -ne 409 ]; then
  echo "Expected 409 on duplicate cast, got $dup_code"
  exit 1
fi

# PATCH /api/casts/[id]
cast_patch_resp=$(curl -sS -X PATCH "${BASE_URL}/api/casts/${new_cast_id}" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"UpdatedSmoke","rating":4.2}')
echo "$cast_patch_resp" | jq .
patched_nickname=$(echo "$cast_patch_resp" | jq -r '.item.nickname')
if [ "$patched_nickname" != "UpdatedSmoke" ]; then
  echo "PATCH /api/casts failed: nickname not updated"
  exit 1
fi

# 不在ID 404 を期待
nf_code=$(curl -s -X PATCH "${BASE_URL}/api/casts/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"x"}' \
  -o /dev/null -w "%{http_code}")
if [ "$nf_code" -ne 404 ]; then
  echo "Expected 404 on PATCH non-existent cast, got $nf_code"
  exit 1
fi

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

# ---------------------------
# 回帰検知: Shifts POST -> PATCH
# ---------------------------
echo "== shifts POST/PATCH smoke =="

# 任意の cast（先頭）を取得
first_cast=$(curl -fsS "${BASE_URL}/api/casts" | jq -r '.items[0].id')
if [ -z "${first_cast}" ] || [ "${first_cast}" = "null" ]; then
  echo "No cast found to run POST/PATCH smoke."
  exit 1
fi

START_AT="$(rel_utc "+10 days")"

# END_AT = START_AT + 4h（GNU/BSD 両対応）
if date -u -d "${START_AT} +4 hours" +"%Y-%m-%dT%H:%M:%SZ" >/dev/null 2>&1; then
  END_AT=$(date -u -d "${START_AT} +4 hours" +"%Y-%m-%dT%H:%M:%SZ")
else
  # BSD: START_AT を基準に +4H
  END_AT=$(date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "${START_AT}" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "${START_AT}")
  END_AT=$(date -u -v+4H -j -f "%Y-%m-%dT%H:%M:%SZ" "${END_AT}" +"%Y-%m-%dT%H:%M:%SZ")
fi

post_payload=$(cat <<JSON
{
  "cast_id": "${first_cast}",
  "store_id": "${first_store}",
  "starts_at": "${START_AT}",
  "ends_at": "${END_AT}",
  "status": "scheduled",
  "role": "cast",
  "pay_rate": 2500,
  "memo": "smoke"
}
JSON
)

# POST /api/shifts
post_resp=$(curl -sS -X POST "${BASE_URL}/api/shifts" \
  -H "Content-Type: application/json" \
  -d "${post_payload}")
echo "${post_resp}" | jq .
new_id=$(echo "${post_resp}" | jq -r '.item.id')
if [ -z "${new_id}" ] || [ "${new_id}" = "null" ]; then
  echo "POST /api/shifts did not return item.id"
  exit 1
fi

# PATCH -> canceled
patch_code=$(curl -sS -o /dev/null -w "%{http_code}" -X PATCH "${BASE_URL}/api/shifts/${new_id}" \
  -H "Content-Type: application/json" \
  -d '{"status":"canceled","memo":"smoke canceled"}')
if [ "$patch_code" -ne 200 ]; then
  echo "PATCH /api/shifts/${new_id} failed (HTTP ${patch_code})"
  exit 1
fi

# 取得して canceled を確認
get_one=$(curl -fsS -G "${BASE_URL}/api/shifts" \
  --data-urlencode "cast_id=${first_cast}" \
  --data-urlencode "from=$(rel_utc '+9 days')" \
  --data-urlencode "to=$(rel_utc '+11 days')" \
  --data-urlencode "sort=starts_at")
echo "${get_one}" | jq .
status=$(echo "${get_one}" | jq -r '.items[] | select(.id=="'"${new_id}"'") | .status')
if [ "${status}" != "canceled" ]; then
  echo "Expected status=canceled for ${new_id}, got ${status:-<empty>}"
  exit 1
fi

echo "✅ smoke tests passed"
