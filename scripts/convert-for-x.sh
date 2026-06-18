#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <input.webm> [output.mp4]"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}-x.mp4}"

ffmpeg -y -i "$INPUT" \
  -an \
  -c:v libx264 \
  -profile:v high \
  -level 4.0 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -preset fast \
  -crf 23 \
  "$OUTPUT"

echo "Saved X-ready video: $OUTPUT"