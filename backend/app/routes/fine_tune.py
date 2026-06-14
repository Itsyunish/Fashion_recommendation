"""Fine-tuned model recommendation, seeding, embedding, and compare endpoints."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import FineTuneEmbedding
from app.schemas import CompareResponse, FineTuneCompareItem, RecommendResponse, RecommendationOut
from app.services.feature_extractor import extract_features
from app.services.fine_tune_extractor import extract_fine_tune_features
from app.services.image_repo import (
    find_fine_tune_csv,
    get_fine_tune_embedding_count,
    get_style_by_image_path,
    seed_fine_tune_from_csv,
)
from app.services.similarity import find_similar, find_similar_fine_tune

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
    results = await find_similar_fine_tune(db, query_vec, top_k=top_k)

    return RecommendResponse(
        query_image=file.filename or "image.jpg",
        recommendations=[
            RecommendationOut(
                image_path=f"/images/{Path(path).name}",
                similarity_score=score,
                **(get_style_by_image_path(path) or {}),
            )
            for path, score in results
        ],
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
    ft_results = await find_similar_fine_tune(db, ft_vec, top_k=top_k)

    def _to_item(path: str, score: float, model_type: str) -> FineTuneCompareItem:
        style = get_style_by_image_path(path) or {}
        return FineTuneCompareItem(
            model_type=model_type,
            image_path=f"/images/{Path(path).name}",
            similarity_score=score,
            **style,
        )

    return CompareResponse(
        query_image=file.filename or "image.jpg",
        base_recommendations=[_to_item(p, s, "base") for p, s in base_results],
        fine_tune_recommendations=[_to_item(p, s, "fine_tune") for p, s in ft_results],
    )
