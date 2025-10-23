#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/dev.sh [--build] [--detach]

Runs the full DocInsight stack (discovery-service, api-gateway, analysis-service, frontend)
using docker compose. Options:
  --build   Build images before starting
  --detach  Start in detached mode

Examples:
  scripts/dev.sh --build
  scripts/dev.sh --detach
EOF
}

BUILD_FLAG=""
DETACH_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --build)
      BUILD_FLAG="--build"
      ;;
    --detach)
      DETACH_FLAG="-d"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage
      exit 1
      ;;
  esac
done

if command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  DC="docker compose"
fi

exec $DC up $BUILD_FLAG $DETACH_FLAG
