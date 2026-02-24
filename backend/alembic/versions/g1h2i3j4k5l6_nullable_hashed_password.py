"""nullable hashed_password for OAuth users

Revision ID: g1h2i3j4k5l6
Revises: f0a1b2c3d4e5
Create Date: 2026-02-22

"""
from alembic import op
import sqlalchemy as sa


revision = "g1h2i3j4k5l6"
down_revision = "f0a1b2c3d4e5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "hashed_password",
            existing_type=sa.String(255),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "hashed_password",
            existing_type=sa.String(255),
            nullable=False,
        )
