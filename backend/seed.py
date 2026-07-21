#!/usr/bin/env python3
"""One‑time script to bulk‑insert ``embeddings.csv`` into PostgreSQL.

Usage:
    python seed.py
"""
import csv
import json
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.database import Base
from app.models import Embedding


def seed(engine, csv_path: str, batch_size: int = 500) -> None:
    """Read *csv_path* and insert all embedding rows in batches."""
    Base.metadata.create_all(engine)

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()

    total = 0
    with Session(engine) as session:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            batch: list[dict] = []
            for row in reader:
                embedding = json.loads(row["embedding"])
                batch.append({"image_path": row["image_path"], "embedding": embedding})
                if len(batch) >= batch_size:
                    _insert_batch(session, batch)
                    total += len(batch)
                    print(f"  Inserted {total} rows …")
                    batch.clear()
            if batch:
                _insert_batch(session, batch)
                total += len(batch)
        print(f"Done — {total} embeddings inserted.")


def _insert_batch(session: Session, batch: list[dict]) -> None:
    """Insert a batch of embeddings and commit."""
    for row in batch:
        session.add(Embedding(image_path=row["image_path"], embedding=row["embedding"]))
    session.commit()


if __name__ == "__main__":
    csv_candidates = [
        Path(__file__).resolve().parent.parent / "embeddings.csv",
        Path(__file__).resolve().parent / "embeddings.csv",
    ]
    csv_file = next((c for c in csv_candidates if c.exists()), None)
    if csv_file is None:
        print("ERROR: embeddings.csv not found at:\n  " +
              "\n  ".join(str(c) for c in csv_candidates))
        sys.exit(1)

    engine = create_engine(settings.DATABASE_URL_SYNC)
    print(f"Seeding from {csv_file} …")
    seed(engine, str(csv_file))
