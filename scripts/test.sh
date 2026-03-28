#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-all}"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  ACTIVATE="$ROOT_DIR/backend/.venv/Scripts/activate"
else
  ACTIVATE="$ROOT_DIR/backend/.venv/bin/activate"
fi

run_backend_lint() {
  echo "--- Backend Lint (ruff) ---"
  cd "$ROOT_DIR/backend"
  source "$ACTIVATE"
  ruff check app/ tests/ && echo "PASS" || echo "FAIL"
}

run_backend_test() {
  echo "--- Backend Tests (pytest) ---"
  cd "$ROOT_DIR/backend"
  source "$ACTIVATE"
  pytest tests/ -v
}

run_frontend_lint() {
  echo "--- Frontend Lint (eslint) ---"
  cd "$ROOT_DIR/frontend"
  npm run lint && echo "PASS" || echo "FAIL"
}

run_frontend_test() {
  echo "--- Frontend Tests (vitest) ---"
  cd "$ROOT_DIR/frontend"
  npm run test
}

case "$MODE" in
  lint)
    run_backend_lint
    run_frontend_lint
    ;;
  backend)
    run_backend_lint
    run_backend_test
    ;;
  frontend)
    run_frontend_lint
    run_frontend_test
    ;;
  --coverage)
    cd "$ROOT_DIR/backend" && source "$ACTIVATE" && pytest tests/ --cov=app --cov-report=term-missing
    cd "$ROOT_DIR/frontend" && npm run test -- --coverage
    ;;
  *)
    run_backend_lint
    run_backend_test
    run_frontend_lint
    run_frontend_test
    ;;
esac
