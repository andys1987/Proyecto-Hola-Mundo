#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_NAME="holotrader-prototipo.zip"
OUT_PATH="${ROOT_DIR}/${OUT_NAME}"

cd "$ROOT_DIR"
rm -f "$OUT_PATH"
zip -r "$OUT_PATH" index.html app.js styles.css README.md >/dev/null

echo "$OUT_PATH"
