"""add completed_at to action_items

Revision ID: e9f0a123bcde
Revises: d8e9f0123abc
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa


revision = "e9f0a123bcde"
down_revision = "d8e9f0123abc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("action_items", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("action_items", "completed_at")
