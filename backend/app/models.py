"""SQLAlchemy ORM models."""
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, Text

from app.config import settings
from app.database import Base


class Embedding(Base):
    """Stores 1536‑dim feature vectors alongside their image paths."""

    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIM), nullable=False)
