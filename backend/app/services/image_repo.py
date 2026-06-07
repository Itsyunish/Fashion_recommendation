"""Database operations for the embeddings table.

Responsibility of **Team C**.
"""
import csv
import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Embedding


def find_csv() -> Path | None:
    """Return the path of the first existing ``embeddings.csv``, or ``None``."""
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent / "embeddings.csv",
        Path("/app/embeddings.csv"),
        Path("embeddings.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


async def get_embedding_count(db: AsyncSession) -> int:
    """Return the number of rows in the embeddings table."""
    count = await db.scalar(select(func.count(Embedding.id)))
    return count or 0


async def seed_from_csv(db: AsyncSession, csv_path: str) -> int:
    """Read *csv_path* and bulk‑insert all rows. Returns the number inserted."""
    total = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            embedding = json.loads(row["embedding"])
            db.add(Embedding(image_path=row["image_path"], embedding=embedding))
            total += 1
            if total % 500 == 0:
                await db.flush()
        await db.commit()
    return total
