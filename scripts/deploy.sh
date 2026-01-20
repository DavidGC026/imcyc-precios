#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="/var/www/html/precios"
BUILD_DIR="$(dirname "$0")/../build"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR" >&2
  exit 1
fi

# Try passwordless sudo first
if sudo -n true 2>/dev/null; then
  sudo mkdir -p "$DEST_DIR"
  sudo rsync -a --delete "$BUILD_DIR"/ "$DEST_DIR"/
  echo "Deployed to $DEST_DIR (sudo -n)"
  exit 0
fi

# Fallback: attempt without sudo (user must have permissions)
mkdir -p "$DEST_DIR" 2>/dev/null || true
if rsync -a --delete "$BUILD_DIR"/ "$DEST_DIR"/ 2>/dev/null; then
  echo "Deployed to $DEST_DIR (no sudo)"
  exit 0
fi

# If we get here, notify about sudo requirement
cat >&2 <<EOF
ERROR: Deployment requires sudo privileges.
Run this once to authorize:
  sudo rsync -a --delete "$BUILD_DIR"/ "$DEST_DIR"/
Or add your user to have write permissions on $DEST_DIR.
EOF
exit 1
