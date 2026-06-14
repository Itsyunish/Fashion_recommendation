"""SQLAlchemy ORM models."""
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Integer, String, Text, text

from app.config import settings
from app.database import Base


class Embedding(Base):
    """Stores 1536‑dim feature vectors alongside their image paths."""

    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)


class User(Base):
    """Registered user accounts."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=text("NOW()"))


class FineTuneEmbedding(Base):
    """Stores fine-tuned 1536-dim feature vectors alongside their image paths."""

    __tablename__ = "fine_tune_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)
