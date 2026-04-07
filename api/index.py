import sys
import os

# backend 폴더를 파이썬 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# DB 테이블 자동 생성 (배포 시 최초 1회 실행)
try:
    from alembic.config import Config
    from alembic import command

    _base = os.path.join(os.path.dirname(__file__), '..', 'backend')
    alembic_cfg = Config()
    alembic_cfg.set_main_option('script_location', os.path.join(_base, 'alembic'))
    alembic_cfg.set_main_option('sqlalchemy.url', os.environ.get('DATABASE_URL', ''))
    command.upgrade(alembic_cfg, 'head')
except Exception as e:
    print(f"Migration note: {e}")

from app.main import app
