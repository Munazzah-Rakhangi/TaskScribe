"""add meeting_embeddings for semantic search (RAG)

Revision ID: i3j4k5l6m7n8
Revises: h2i3j4k5l6m7
Create Date: 2026-02-27

"""
from alembic import op
from sqlalchemy import text


revision = "i3j4k5l6m7n8"
down_revision = "h2i3j4k5l6m7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS meeting_embeddings (
            meeting_id INTEGER NOT NULL PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
            embedding_json TEXT NOT NULL
        )
    """))


def downgrade() -> None:
    op.drop_table("meeting_embeddings", if_exists=True)
