#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== 사업예산 관리 시스템 의존성 설치 ==="

# ── Backend ──────────────────────────────────────────────
echo ""
echo "[1/3] Backend Python 환경 설정..."
cd "$ROOT_DIR/backend"

if [ ! -d ".venv" ]; then
  python -m venv .venv
  echo "  가상환경 생성 완료"
else
  echo "  가상환경 이미 존재 - 건너뜀"
fi

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  ACTIVATE=".venv/Scripts/activate"
else
  ACTIVATE=".venv/bin/activate"
fi

source "$ACTIVATE"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "  Python 패키지 설치 완료"

# ── Alembic 마이그레이션 ──────────────────────────────────
echo ""
echo "[2/3] DB 마이그레이션 실행..."
cd "$ROOT_DIR/backend"
source "$ACTIVATE"
if [ -f "alembic.ini" ]; then
  alembic upgrade head
  echo "  마이그레이션 완료"
else
  echo "  alembic.ini 없음 - 건너뜀"
fi

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "[3/3] Frontend Node.js 의존성 설치..."
cd "$ROOT_DIR/frontend"
npm install --silent
echo "  npm 패키지 설치 완료"

echo ""
echo "=== 설치 완료 ==="
echo ""
echo "개발 서버 실행: bash scripts/dev.sh"
echo "테스트 실행:   bash scripts/test.sh"
