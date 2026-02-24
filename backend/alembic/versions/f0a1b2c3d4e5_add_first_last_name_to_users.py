"""add first_name last_name to users

Revision ID: f0a1b2c3d4e5
Revises: e9f0a123bcde
Create Date: 2026-02-22

"""
from alembic import op
import sqlalchemy as sa


revision = "f0a1b2c3d4e5"
down_revision = "e9f0a123bcde"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
