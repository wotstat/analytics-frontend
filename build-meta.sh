#!/bin/sh
set -eu

cd "$(dirname "$0")"

BUILD_TARGET=meta-renderer bunx --bun vite build --mode prod
BUILD_TARGET=meta-server bunx --bun vite build --mode prod
cp dist/index.html dist-meta/spa.html
