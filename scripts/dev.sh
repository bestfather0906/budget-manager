#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-all}"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  ACTIVATE="$ROOT_DIR/backend/.venv/Scripts/activate"
else
  ACTIVATE="$ROOT_DIR/backend/.venv/bin/activate"
fi

start_backend() {
  echo "Backend 시작 (http://localhost:8000)..."
  cd "$ROOT_DIR/backend"
  source "$ACTIVATE"
  uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
}

start_frontend() {
  echo "Frontend 시작 (http://localhost:5173)..."
  cd "$ROOT_DIR/frontend"
  npm run dev
}

case "$MODE" in
  backend)
    start_backend
    ;;
  frontend)
    start_frontend
    ;;
  *)
    start_backend &
    BACKEND_PID=$!
    sleep 2
    start_frontend &
    FRONTEND_PID=$!
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
    ;;
esac
