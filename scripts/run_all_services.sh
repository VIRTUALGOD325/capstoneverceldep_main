#!/usr/bin/env bash
set -euo pipefail

# Run/stop/status for all DocInsight services with Eureka registration.
# Usage:
#   scripts/run_all_services.sh start|stop|status|logs <service>

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
STATE_DIR="$ROOT_DIR/scripts/.state"
mkdir -p "$LOG_DIR" "$STATE_DIR"

# Default Eureka URL for local runs; can be overridden by env.
EUREKA_URL="${EUREKA_SERVER_URL:-http://localhost:8761/eureka}"
export EUREKA_SERVER_URL="$EUREKA_URL"

# Service -> port map (start order matters for first two)
SERVICES_ORDERED=(
  discovery-service
  api-gateway
  analysis-service
  scoring-service
  citation-service
  fine-tuning-service
  user-service
  notification-service
  audit-service
  model-service
)

declare -A PORTS=(
  [discovery-service]=8761
  [api-gateway]=8080
  [analysis-service]=8085
  [scoring-service]=8086
  [citation-service]=8087
  [fine-tuning-service]=8088
  [user-service]=8089
  [notification-service]=8090
  [audit-service]=8091
  [model-service]=8092
)

pid_file() { echo "$STATE_DIR/$1.pid"; }
log_file() { echo "$LOG_DIR/$1.log"; }

wait_healthy() {
  local name="$1"; local port="$2"; local tries=60
  local url="http://localhost:${port}/actuator/health"
  for i in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[$name] is healthy at $url"
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for $name on $url" >&2
  return 1
}

start_service() {
  local name="$1"; local port="$2"; local dir="$ROOT_DIR/$1"
  if [[ ! -d "$dir" ]]; then
    echo "Skipping $name (directory not found: $dir)" >&2
    return 0
  fi
  if [[ -f "$(pid_file "$name")" ]] && kill -0 "$(cat "$(pid_file "$name")")" 2>/dev/null; then
    echo "$name already running (PID $(cat "$(pid_file "$name")"))"
    return 0
  fi
  echo "Starting $name on port $port ..."
  (
    cd "$dir"
    # Use spring-boot:run for dev speed; jars not required.
    nohup mvn -q -DskipTests spring-boot:run \
      > "$(log_file "$name")" 2>&1 & echo $! > "$(pid_file "$name")"
  )
}

stop_service() {
  local name="$1"; local pf="$(pid_file "$name")"
  if [[ -f "$pf" ]]; then
    local pid; pid="$(cat "$pf" || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $name (PID $pid) ..."
      kill "$pid" 2>/dev/null || true
      # Graceful wait then force
      for i in {1..20}; do
        kill -0 "$pid" 2>/dev/null || { rm -f "$pf"; echo "$name stopped"; return 0; }
        sleep 0.5
      done
      kill -9 "$pid" 2>/dev/null || true
      rm -f "$pf"
      echo "$name force-stopped"
    else
      rm -f "$pf"
    fi
  fi
}

status_service() {
  local name="$1"; local port="${PORTS[$name]}"; local pf="$(pid_file "$name")"
  local pid="-"; [[ -f "$pf" ]] && pid="$(cat "$pf" 2>/dev/null || echo -)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "$(printf "%-24s" "$name") RUNNING  pid=$pid  port=$port"
  else
    echo "$(printf "%-24s" "$name") STOPPED  port=$port"
  fi
}

start_all() {
  # Start discovery and wait healthy
  start_service discovery-service "${PORTS[discovery-service]}"
  wait_healthy discovery-service "${PORTS[discovery-service]}"
  # Start gateway and wait healthy
  start_service api-gateway "${PORTS[api-gateway]}"
  wait_healthy api-gateway "${PORTS[api-gateway]}"
  # Start remaining in background
  for name in "${SERVICES_ORDERED[@]}"; do
    [[ "$name" == "discovery-service" || "$name" == "api-gateway" ]] && continue
    start_service "$name" "${PORTS[$name]}"
  done
  echo "All start commands issued. Use 'status' to verify or 'logs <service>' to follow logs."
}

stop_all() {
  # Stop in reverse order
  for (( idx=${#SERVICES_ORDERED[@]}-1 ; idx>=0 ; idx-- )); do
    stop_service "${SERVICES_ORDERED[$idx]}"
  done
}

status_all() {
  for name in "${SERVICES_ORDERED[@]}"; do
    status_service "$name"
  done
}

logs_service() {
  local name="$1"
  if [[ -z "${name:-}" ]]; then
    echo "Provide a service name for logs."
    exit 1
  fi
  local lf="$(log_file "$name")"
  if [[ ! -f "$lf" ]]; then
    echo "No log file yet for $name at $lf"
    exit 1
  fi
  echo "Tailing logs for $name (Ctrl-C to stop)"
  tail -f "$lf"
}

cmd="${1:-start}"
case "$cmd" in
  start) start_all ;;
  stop) stop_all ;;
  status) status_all ;;
  logs) shift || true; logs_service "${1:-}" ;;
  *) echo "Unknown command: $cmd"; echo "Use: start|stop|status|logs <service>"; exit 1 ;;
 esac
