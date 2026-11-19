#!/data/data/com.termux/files/usr/bin/bash
# Keeps the matt-learning HTTP server running in the background on port 8080.
# Safe to call repeatedly (e.g. from ~/.bashrc or ~/.termux/boot/).

PORT=8080
DIR="$HOME/matt-learning"
CACHE_DIR="$HOME/.cache"
PID_FILE="$CACHE_DIR/matt-learning-server.pid"
LOG_FILE="$CACHE_DIR/matt-learning-server.log"

mkdir -p "$CACHE_DIR"

is_running() {
  if [ -f "$PID_FILE" ]; then
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  # Fallback: check if port 8080 is already bound
  python3 -c "import socket, sys; s = socket.socket(); s.settimeout(0.3); sys.exit(0 if s.connect_ex(('127.0.0.1', $PORT)) == 0 else 1)" 2>/dev/null
}

start_server() {
  if is_running; then
    return 0
  fi
  nohup python3 -m http.server "$PORT" --directory "$DIR" >"$LOG_FILE" 2>&1 </dev/null &
  echo $! >"$PID_FILE"
}

stop_server() {
  if [ -f "$PID_FILE" ]; then
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
    fi
    rm -f "$PID_FILE"
  fi
}

case "${1:-start}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    echo "Stopped matt-learning server."
    ;;
  restart)
    stop_server
    sleep 0.2
    start_server
    echo "Restarted matt-learning server on http://localhost:$PORT"
    ;;
  status)
    if is_running; then
      echo "Running on http://localhost:$PORT (pid $(cat "$PID_FILE" 2>/dev/null || echo '?'))"
    else
      echo "Not running."
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
