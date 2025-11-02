#!/usr/bin/env bash
set -euo pipefail

# TIARA_API_REPO のパス（相対 or 絶対）
TIARA_API_REPO="${TIARA_API_REPO:-../tiara-api}"
SRC="$TIARA_API_REPO/docs/openapi.yaml"
DST="public/openapi.yaml"

if [ ! -f "$SRC" ]; then
  echo "✗ not found: $SRC"
  exit 1
fi

mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "✓ synced: $SRC -> $DST"
