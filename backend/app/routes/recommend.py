"""Base-model recommendation, seeding, and embedding endpoints."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Embedding
from app.schemas import RecommendResponse, RecommendationOut, StoreOut
from app.services.feature_extractor import extract_features
from app.services.image_repo import (
    find_csv,
    get_embedding_count,
    get_style_by_image_path,
    seed_from_csv,
)
from app.services.similarity import find_similar
from app.services.store_repo import get_stores_for_product

router = APIRouter(tags=["base"])

ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/api/recommend", response_model=RecommendResponse)
async def recommend(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=50),
    target_category: str | None = Query(None, description="Filter to a sub_category (e.g. Bottomwear, Topwear)"),
    db: AsyncSession = Depends(get_db),
) -> RecommendResponse:
    """Upload an outfit image and return top‑K similar items from the database.

    If ``target_category`` is set, fetch extra candidates and filter results
    to only those whose *sub_category* matches the given value.
    """
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()
    query_vec = extract_features(content)

    fetch_k = top_k * 40 if target_category else top_k
    results = await find_similar(db, query_vec, top_k=fetch_k)

    recommendations = []
    for path, score in results:
        product_id = int(Path(path).stem)
        style = get_style_by_image_path(path) or {}
        if target_category:
            sub = (style.get("sub_category") or "").strip().lower()
            if sub != target_category.strip().lower():
                continue
        stores = await get_stores_for_product(db, product_id)
        recommendations.append(
            RecommendationOut(
                image_path=f"/images/{Path(path).name}",
                similarity_score=score,
                **style,
                stores=[StoreOut(**s) for s in stores] if stores else None,
            )
        )
        if len(recommendations) >= top_k:
            break

    return RecommendResponse(
        query_image=file.filename or "image.jpg",
        recommendations=recommendations,
    )


@router.get("/api/seed/status")
async def seed_status(db: AsyncSession = Depends(get_db)) -> dict:
    """Return whether the embeddings table has been seeded and the row count."""
    try:
        count = await get_embedding_count(db)
        return {"seeded": count > 0, "count": count}
    except Exception:
        return {"seeded": False, "count": 0}


@router.post("/api/seed")
async def seed_embeddings(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Read ``embeddings.csv`` and bulk‑insert all rows into the database."""
    csv_path = find_csv()
    if csv_path is None:
        raise HTTPException(404, "embeddings.csv not found on server")

    await db.execute(text("DELETE FROM embeddings"))
    await db.commit()

    total = await seed_from_csv(db, str(csv_path))
    return {"message": f"Re-seeded {total} embeddings", "source": str(csv_path)}


@router.post("/api/embeddings", status_code=201)
async def add_embedding(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload an image, extract features, and save the embedding to the database."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()

    images_dir = Path(__file__).resolve().parent.parent.parent / "static" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = images_dir / filename
    save_path.write_bytes(content)

    vec = extract_features(content)
    db.add(Embedding(image_path=str(save_path), embedding=vec.tolist()))
    await db.commit()

    return {"message": "Embedding saved", "image_path": f"/images/{filename}"}
