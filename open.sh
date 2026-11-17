#!/bin/sh
# Open articles directly on Boox Go 10.3 using Android ACTION_VIEW
TARGET="${1:-index.html}"
DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$DIR/$TARGET"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  echo "Usage: ./open.sh [index.html | attention.html | gkd.html]"
  exit 1
fi

echo "Opening $FILE on Boox Go 10.3..."
termux-open "$FILE"
