"""Fine-tuned model recommendation, seeding, embedding, and compare endpoints."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import ensure_keras_table, get_db
from app.models import FineTuneEmbedding
from app.schemas import CompareResponse, FineTuneCompareItem, RecommendResponse, RecommendationOut, StoreOut
from app.services.feature_extractor import extract_features
from app.services.fine_tune_extractor import extract_fine_tune_features, get_keras_output_dim
from app.services.image_repo import (
    find_fine_tune_csv,
    get_fine_tune_embedding_count,
    get_style_by_image_path,
    seed_fine_tune_from_csv,
)
from app.services.similarity import find_similar, find_similar_fine_tune, find_similar_keras_fine_tune
from app.services.store_repo import get_stores_for_product

router = APIRouter(tags=["fine_tune"])

ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/api/fine-tune/recommend", response_model=RecommendResponse)
async def fine_tune_recommend(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> RecommendResponse:
    """Upload an image and return top‑K similar items using the fine-tuned model."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()
    query_vec = extract_fine_tune_features(content)
    if query_vec is None:
        raise HTTPException(503, "fine-tuned model is not available (model file missing)")

    if settings.USE_KERAS:
        results = await find_similar_keras_fine_tune(db, query_vec, top_k=top_k)
    else:
        results = await find_similar_fine_tune(db, query_vec, top_k=top_k)

    recommendations = []
    for path, score in results:
        product_id = int(Path(path).stem)
        style = get_style_by_image_path(path) or {}
        stores = await get_stores_for_product(db, product_id, article_type=style.get("article_type"))
        recommendations.append(
            RecommendationOut(
                image_path=f"/images/{Path(path).name}",
                similarity_score=score,
                **style,
                stores=[StoreOut(**s) for s in stores] if stores else None,
            )
        )

    return RecommendResponse(
        query_image=file.filename or "image.jpg",
        recommendations=recommendations,
    )


@router.get("/api/fine-tune/seed/status")
async def fine_tune_seed_status(db: AsyncSession = Depends(get_db)) -> dict:
    """Check if the fine-tune embeddings table has been seeded."""
    try:
        count = await get_fine_tune_embedding_count(db)
        return {"seeded": count > 0, "count": count}
    except Exception:
        return {"seeded": False, "count": 0}


@router.post("/api/fine-tune/seed")
async def fine_tune_seed_embeddings(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Read fine-tune embeddings CSV and bulk‑insert into the database."""
    csv_path = find_fine_tune_csv()
    if csv_path is None:
        raise HTTPException(404, "fine-tune embeddings CSV not found on server")

    if settings.USE_KERAS:
        dim = get_keras_output_dim()
        if dim is None:
            raise HTTPException(503, "Keras model not loaded; cannot determine embedding dimension")
        await ensure_keras_table(dim)
        await db.execute(text("DELETE FROM keras_fine_tune_embeddings"))
    else:
        await db.execute(text("DELETE FROM fine_tune_embeddings"))
    await db.commit()

    total = await seed_fine_tune_from_csv(db, str(csv_path))
    return {"message": f"Re-seeded {total} fine-tune embeddings", "source": str(csv_path)}


@router.post("/api/fine-tune/embeddings", status_code=201)
async def add_fine_tune_embedding(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload an image and save its fine-tuned embedding to the database."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()

    images_dir = Path(__file__).resolve().parent.parent.parent / "static" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = images_dir / filename
    save_path.write_bytes(content)

    vec = extract_fine_tune_features(content)
    if vec is None:
        raise HTTPException(503, "fine-tuned model is not available (model file missing)")

    vec_literal = "[" + ",".join(str(v) for v in vec.tolist()) + "]"
    if settings.USE_KERAS:
        dim = get_keras_output_dim()
        if dim is None:
            raise HTTPException(503, "Keras model not loaded")
        await ensure_keras_table(dim)
        await db.execute(text(f"""
            INSERT INTO keras_fine_tune_embeddings (image_path, embedding)
            VALUES (:path, '{vec_literal}'::vector)
        """), {"path": str(save_path)})
    else:
        db.add(FineTuneEmbedding(image_path=str(save_path), embedding=vec.tolist()))
    await db.commit()

    return {"message": "Fine-tune embedding saved", "image_path": f"/images/{filename}"}


@router.post("/api/fine-tune/compare", response_model=CompareResponse)
async def fine_tune_compare(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> CompareResponse:
    """Compare recommendations from both base and fine-tuned models side by side."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()

    base_vec = extract_features(content)
    base_results = await find_similar(db, base_vec, top_k=top_k)

    ft_vec = extract_fine_tune_features(content)
    if ft_vec is None:
        raise HTTPException(503, "fine-tuned model is not available (model file missing)")

    if settings.USE_KERAS:
        ft_results = await find_similar_keras_fine_tune(db, ft_vec, top_k=top_k)
    else:
        ft_results = await find_similar_fine_tune(db, ft_vec, top_k=top_k)

    async def _to_item(path: str, score: float, model_type: str) -> FineTuneCompareItem:
        product_id = int(Path(path).stem)
        style = get_style_by_image_path(path) or {}
        stores = await get_stores_for_product(db, product_id, article_type=style.get("article_type"))
        return FineTuneCompareItem(
            model_type=model_type,
            image_path=f"/images/{Path(path).name}",
            similarity_score=score,
            **style,
            stores=[StoreOut(**s) for s in stores] if stores else None,
        )

    base_items = [await _to_item(p, s, "base") for p, s in base_results]
    ft_items = [await _to_item(p, s, "fine_tune") for p, s in ft_results]

    return CompareResponse(
        query_image=file.filename or "image.jpg",
        base_recommendations=base_items,
        fine_tune_recommendations=ft_items,
    )
