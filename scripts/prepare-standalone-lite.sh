#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"
DEPLOY="$ROOT/deploy"

if [[ ! -f "$STANDALONE/server.js" ]]; then
  echo "Missing $STANDALONE/server.js — run pnpm build first." >&2
  exit 1
fi

rm -rf "$DEPLOY"
mkdir -p "$DEPLOY/.next"

cp -a "$STANDALONE/." "$DEPLOY/"
cp -a "$ROOT/.next/static" "$DEPLOY/.next/static"
cp -a "$ROOT/public" "$DEPLOY/public"
cp -a "$ROOT/drizzle" "$DEPLOY/drizzle"
cp "$ROOT/web.config" "$DEPLOY/web.config"
mkdir -p "$DEPLOY/logs"

required_modules=(
  "@swc/helpers"
  "@next/env"
  "@next/swc-win32-x64-msvc"
)

for module_path in "${required_modules[@]}"; do
  if [[ ! -d "$DEPLOY/node_modules/$module_path" ]]; then
    echo "Deploy bundle is missing $module_path (standalone trace may be incomplete)." >&2
    exit 1
  fi
done

echo "Lite deploy bundle ready at $DEPLOY (traced node_modules only)"
