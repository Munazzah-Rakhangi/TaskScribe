"""add_summary_to_meetings

Revision ID: 09b744343efb
Revises: 03e8c358ff66
Create Date: 2026-02-20 16:37:50.088088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09b744343efb'
down_revision: Union[str, Sequence[str], None] = '03e8c358ff66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('meetings', sa.Column('summary', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('meetings', 'summary')
