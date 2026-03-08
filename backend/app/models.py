from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from datetime import datetime
from sqlalchemy import DateTime, func


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)  # null for OAuth-only users
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    password_reset_token = Column(String(255), nullable=True, index=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)

    meetings = relationship("Meeting", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")

    @property
    def has_password(self) -> bool:
        return bool(self.hashed_password)


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")

    user = relationship("User", back_populates="folders")
    meetings = relationship("Meeting", back_populates="folder")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    transcript = Column(String, nullable=False)
    summary = Column(Text, nullable=True)  # AI-generated notes from conversational transcript

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="meetings")
    folder = relationship("Folder", back_populates="meetings")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")



class MeetingEmbedding(Base):
    """One embedding vector per meeting for semantic search (RAG)."""
    __tablename__ = "meeting_embeddings"

    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    embedding_json = Column(Text, nullable=False)  # JSON array of floats from OpenAI


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"))
    task = Column(Text, nullable=False)
    owner = Column(String(255))
    deadline = Column(String(255))
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    meeting = relationship("Meeting", back_populates="action_items")
