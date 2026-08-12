#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STANDALONE="$ROOT/.next/standalone"
DEPLOY="$ROOT/deploy"

REQUIRED_MODULES=(
  "@swc/helpers"
  "@next/swc-win32-x64-msvc"
)

if [[ ! -f "$STANDALONE/server.js" ]]; then
  echo "Missing $STANDALONE/server.js — run pnpm build first." >&2
  exit 1
fi

resolve_module_source() {
  local module_path="$1"
  local src="$ROOT/node_modules/$module_path"

  if [[ -d "$src" ]]; then
    printf '%s\n' "$src"
    return 0
  fi

  find "$ROOT/node_modules/.pnpm" -path "*/node_modules/$module_path" -type d 2>/dev/null | head -1
}

copy_runtime_module() {
  local module_path="$1"
  local dest="$DEPLOY/node_modules/$module_path"

  if [[ -d "$dest" ]]; then
    return 0
  fi

  local src
  src="$(resolve_module_source "$module_path")"

  if [[ -z "$src" || ! -d "$src" ]]; then
    echo "Missing runtime module source: $module_path" >&2
    return 1
  fi

  mkdir -p "$(dirname "$dest")"
  cp -aL "$src" "$dest"
}

rm -rf "$DEPLOY"
mkdir -p "$DEPLOY/.next"

cp -a "$STANDALONE/." "$DEPLOY/"
cp -a "$ROOT/.next/static" "$DEPLOY/.next/static"
cp -a "$ROOT/public" "$DEPLOY/public"
cp -a "$ROOT/drizzle" "$DEPLOY/drizzle"
cp "$ROOT/web.config" "$DEPLOY/web.config"
mkdir -p "$DEPLOY/logs"

for module_path in "${REQUIRED_MODULES[@]}"; do
  copy_runtime_module "$module_path"
done

if [[ ! -d "$DEPLOY/node_modules/@swc/helpers" ]]; then
  echo "Deploy bundle is still missing @swc/helpers after copy." >&2
  exit 1
fi

echo "Deploy bundle ready at $DEPLOY"
