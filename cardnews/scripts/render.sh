#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: sh scripts/render.sh <input.md> [output-directory]" >&2
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CARDNEWS_DIR=$(dirname "$SCRIPT_DIR")
INPUT_PATH=$1
INPUT_NAME=$(basename "$INPUT_PATH" .md)
OUTPUT_DIR=${2:-"$CARDNEWS_DIR/output/$INPUT_NAME"}
JSON_PATH="$OUTPUT_DIR/cardnews.json"

mkdir -p "$OUTPUT_DIR"
node "$SCRIPT_DIR/md_to_cardnews.js" "$INPUT_PATH" "$JSON_PATH"
node "$SCRIPT_DIR/render_cardnews.js" "$JSON_PATH" "$OUTPUT_DIR"
