"""pgvector cosine-similarity search.

Responsibility of **Team B**.
"""
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


async def find_similar(
    db: AsyncSession,
    query_embedding: np.ndarray,
    top_k: int = settings.TOP_K_RECOMMENDATIONS,
) -> list[tuple[str, float]]:
    """Return top‑K (image_path, similarity_score) using pgvector cosine distance."""
    vec_literal = "[" + ",".join(str(v) for v in query_embedding.tolist()) + "]"

    stmt = text(f"""
        SELECT image_path, 1 - (embedding <=> '{vec_literal}'::vector) AS similarity
        FROM embeddings
        ORDER BY similarity DESC
        LIMIT :top_k
    """)
    result = await db.execute(stmt, {"top_k": top_k})
    rows = result.fetchall()
    return [(row[0], float(row[1])) for row in rows]
