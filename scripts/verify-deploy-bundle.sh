#!/usr/bin/env bash
# Shared checks after copying standalone + static into deploy/
verify_deploy_bundle() {
  local deploy="$1"
  local static_dir="$deploy/.next/static"
  local chunks_dir="$static_dir/chunks"

  if [[ ! -f "$deploy/server.js" ]]; then
    echo "Deploy bundle missing server.js" >&2
    exit 1
  fi

  if [[ ! -d "$static_dir" ]]; then
    echo "Deploy bundle missing .next/static — CSS/JS will 404/500. Ensure pnpm build ran postbuild sync." >&2
    exit 1
  fi

  local chunk_count
  chunk_count="$(find "$chunks_dir" -maxdepth 1 -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${chunk_count:-0}" -lt 3 ]]; then
    echo "Deploy bundle has too few JS chunks in .next/static/chunks ($chunk_count). Build may be incomplete." >&2
    exit 1
  fi

  local css_count
  css_count="$(find "$static_dir" -name '*.css' 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${css_count:-0}" -lt 1 ]]; then
    echo "Deploy bundle has no CSS under .next/static. Build may be incomplete." >&2
    exit 1
  fi
}
