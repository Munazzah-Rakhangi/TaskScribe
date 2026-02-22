"""add_users_and_meeting_user_id

Revision ID: a5b3a5b7ef24
Revises: 09b744343efb
Create Date: 2026-02-20 17:00:53.570125

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5b3a5b7ef24'
down_revision: Union[str, Sequence[str], None] = '09b744343efb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.add_column('meetings', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_meetings_user_id', 'meetings', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_meetings_user_id'), 'meetings', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_meetings_user_id'), table_name='meetings')
    op.drop_constraint('fk_meetings_user_id', 'meetings', type_='foreignkey')
    op.drop_column('meetings', 'user_id')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
