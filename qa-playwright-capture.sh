#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
OUTPUT_DIR="${2:-public/qa-screenshots}"
node scripts/qa-playwright-capture.mjs "$BASE_URL" "$OUTPUT_DIR"
