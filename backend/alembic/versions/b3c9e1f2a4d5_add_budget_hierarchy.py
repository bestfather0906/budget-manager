"""add budget hierarchy: sub_categories and budget_items, refactor expenses

Revision ID: b3c9e1f2a4d5
Revises: af56c296de5b
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3c9e1f2a4d5'
down_revision: Union[str, None] = 'af56c296de5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. budget_sub_categories 테이블 생성 (세세목)
    op.create_table(
        'budget_sub_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['category_id'], ['budget_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_budget_sub_categories_id'), 'budget_sub_categories', ['id'], unique=False)

    # 2. budget_items 테이블 생성 (품목)
    op.create_table(
        'budget_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sub_category_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('unit_price', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('note', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['sub_category_id'], ['budget_sub_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_budget_items_id'), 'budget_items', ['id'], unique=False)

    # 3. expenses 테이블 수정: category_id → budget_item_id
    # 3-1. 기존 데이터 삭제 (테스트 데이터만 있으므로 안전)
    op.execute('DELETE FROM expenses')

    # 3-2. budget_item_id 컬럼 추가 (nullable로 먼저 추가)
    op.add_column('expenses', sa.Column('budget_item_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_expenses_budget_item_id', 'expenses', 'budget_items',
        ['budget_item_id'], ['id']
    )

    # 3-3. category_id FK 제약 삭제 후 컬럼 삭제
    op.drop_constraint('expenses_category_id_fkey', 'expenses', type_='foreignkey')
    op.drop_column('expenses', 'category_id')

    # 3-4. budget_item_id NOT NULL로 변경
    op.alter_column('expenses', 'budget_item_id', nullable=False)

    # 4. budget_categories.allocated_amount 컬럼 삭제 (계획금액은 품목에서 계산)
    op.drop_column('budget_categories', 'allocated_amount')


def downgrade() -> None:
    op.add_column('budget_categories', sa.Column('allocated_amount', sa.BigInteger(), nullable=False, server_default='0'))

    op.add_column('expenses', sa.Column('category_id', sa.Integer(), nullable=True))
    op.drop_constraint('fk_expenses_budget_item_id', 'expenses', type_='foreignkey')
    op.drop_column('expenses', 'budget_item_id')

    op.drop_index(op.f('ix_budget_items_id'), table_name='budget_items')
    op.drop_table('budget_items')
    op.drop_index(op.f('ix_budget_sub_categories_id'), table_name='budget_sub_categories')
    op.drop_table('budget_sub_categories')
