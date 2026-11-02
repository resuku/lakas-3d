#!/usr/bin/env bash
# Képernyőképek a futó dev szerverről a screenshots/ mappába.
# Példa: scripts/shot.sh '[{"shot":"start"},{"click":"Dolgozó"},{"shot":"dolgozo"}]'
set -euo pipefail
cd "$(dirname "$0")/.."
WORK="$(pwd -W 2>/dev/null || pwd)"
DEFAULT='[{"shot":"start"}]'
STEPS="${1:-$DEFAULT}"
mkdir -p screenshots
MSYS_NO_PATHCONV=1 docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "$WORK:/work" -v lakas3d-playwright:/pw -w /pw \
  mcr.microsoft.com/playwright:v1.49.1-noble \
  bash -c '[ -d node_modules/playwright ] || (npm init -y >/dev/null && npm i playwright@1.49.1 >/dev/null 2>&1); cp /work/scripts/shot.mjs . && node shot.mjs "$0"' "$STEPS"
