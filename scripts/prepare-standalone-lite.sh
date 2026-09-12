#!/usr/bin/env bash
# Lite bundle: app + static only. node_modules must already exist on the server from a full deploy.
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
rm -rf "$DEPLOY/node_modules"

cp -a "$ROOT/.next/static" "$DEPLOY/.next/static"
if [[ -f "$ROOT/.next/BUILD_ID" ]]; then
  cp "$ROOT/.next/BUILD_ID" "$DEPLOY/build-id.txt"
  mkdir -p "$DEPLOY/.next"
  cp "$ROOT/.next/BUILD_ID" "$DEPLOY/.next/BUILD_ID"
fi
find "$DEPLOY/.next/static" -type f > "$DEPLOY/static-file-manifest.txt"
cp -a "$ROOT/public" "$DEPLOY/public"
cp -a "$ROOT/drizzle" "$DEPLOY/drizzle"
cp "$ROOT/web.config" "$DEPLOY/web.config"
mkdir -p "$DEPLOY/logs"

source "$ROOT/scripts/verify-deploy-bundle.sh"
verify_deploy_bundle "$DEPLOY"

echo "Lite deploy bundle ready at $DEPLOY (no node_modules — run full deploy when dependencies change)"
