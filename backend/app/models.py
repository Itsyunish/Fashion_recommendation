"""SQLAlchemy ORM models."""
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB

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


class Store(Base):
    """Physical store locations in Nepal."""

    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    store_type = Column(String(100), nullable=True)
    opening_hours = Column(JSONB, nullable=True)
    map_url = Column(Text, nullable=True)


class StoreInventory(Base):
    """Maps product IDs to stores that carry them."""

    __tablename__ = "store_inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
