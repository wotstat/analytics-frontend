#!/bin/sh
set -e
cd "$(dirname "$0")"
zig build-exe linePath.zig -target wasm32-freestanding -fno-entry -rdynamic -O ReleaseSmall
