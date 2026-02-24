"""add folders and folder_id to meetings

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-02-22

"""
from alembic import op
from sqlalchemy import text
import sqlalchemy as sa


revision = "h2i3j4k5l6m7"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # SQLite: use IF NOT EXISTS for folders (handles partial migration rerun)
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            color VARCHAR(7) NOT NULL DEFAULT '#6366f1'
        )
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_folders_user_id ON folders(user_id)"))
    with op.batch_alter_table("meetings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("folder_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_meetings_folder_id", "folders", ["folder_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_meetings_folder_id", ["folder_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("meetings", schema=None) as batch_op:
        batch_op.drop_constraint("fk_meetings_folder_id", type_="foreignkey")
        batch_op.drop_index("ix_meetings_folder_id", column_names=["folder_id"])
        batch_op.drop_column("folder_id")
    op.drop_table("folders")
