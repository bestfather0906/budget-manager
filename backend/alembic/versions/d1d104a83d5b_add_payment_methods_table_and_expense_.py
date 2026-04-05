"""add payment_methods table and expense payment_method_id

Revision ID: d1d104a83d5b
Revises: 68fb25892a4b
Create Date: 2026-04-05 22:41:45.691600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd1d104a83d5b'
down_revision: Union[str, None] = '68fb25892a4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('payment_methods',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('type', sa.String(length=10), nullable=False),
    sa.Column('nickname', sa.String(length=100), nullable=False),
    sa.Column('number', sa.String(length=50), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_methods_id'), 'payment_methods', ['id'], unique=False)
    # SQLite batch mode for adding column with FK
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.add_column(sa.Column('payment_method_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_expenses_payment_method_id', 'payment_methods', ['payment_method_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_constraint('fk_expenses_payment_method_id', type_='foreignkey')
        batch_op.drop_column('payment_method_id')
    op.drop_index(op.f('ix_payment_methods_id'), table_name='payment_methods')
    op.drop_table('payment_methods')
