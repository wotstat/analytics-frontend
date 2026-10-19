#!/bin/sh
set -eu

cd "$(dirname "$0")"

BUILD_TARGET=meta-renderer bunx --bun vite build --mode prod
BUILD_TARGET=meta-server bunx --bun vite build --mode prod
bun -e "await import('./dist-meta/server.mjs')"
cp dist/index.html dist-meta/spa.html
bun scripts/release.ts
