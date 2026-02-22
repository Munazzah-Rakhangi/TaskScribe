"""add_password_reset_to_users

Revision ID: b7c4d8e9f012
Revises: a5b3a5b7ef24
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c4d8e9f012"
down_revision: Union[str, Sequence[str], None] = "a5b3a5b7ef24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_reset_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_users_password_reset_token"), "users", ["password_reset_token"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_password_reset_token"), table_name="users")
    op.drop_column("users", "password_reset_expires")
    op.drop_column("users", "password_reset_token")
