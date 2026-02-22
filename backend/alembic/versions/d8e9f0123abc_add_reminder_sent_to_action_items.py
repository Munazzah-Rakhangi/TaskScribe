"""add reminder_sent_at to action_items

Revision ID: d8e9f0123abc
Revises: b7c4d8e9f012
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d8e9f0123abc"
down_revision = "b7c4d8e9f012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("action_items", sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("action_items", "reminder_sent_at")
