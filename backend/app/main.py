"""FastAPI app entry point with all endpoints defined inline."""
import os

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import text

from app.database import get_db, init_db
from app.schemas import RecommendResponse, RecommendationOut
from app.services.feature_extractor import extract_features, get_model
from app.services.image_repo import find_csv, get_embedding_count, get_style_by_image_path, seed_from_csv
from app.models import Embedding
from app.services.similarity import find_similar

ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Initialize DB tables and preload the TF model on startup."""
    await init_db()
    get_model()
    yield


app = FastAPI(
    title="Outfit Recommendation System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> RecommendResponse:
    """Upload an outfit image and return top‑K similar items from the database."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()
    query_vec = extract_features(content)
    results = await find_similar(db, query_vec, top_k=top_k)

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


@app.get("/api/seed/status")
async def seed_status(db: AsyncSession = Depends(get_db)) -> dict:
    """Return whether the embeddings table has been seeded and the row count."""
    try:
        count = await get_embedding_count(db)
        return {"seeded": count > 0, "count": count}
    except Exception:
        return {"seeded": False, "count": 0}


@app.post("/api/seed")
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


@app.post("/api/embeddings", status_code=201)
async def add_embedding(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload an image, extract features, and save the embedding to the database."""
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    content = await file.read()

    images_dir = Path(__file__).resolve().parent.parent / "static" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = images_dir / filename
    save_path.write_bytes(content)

    vec = extract_features(content)
    db.add(Embedding(image_path=str(save_path), embedding=vec.tolist()))
    await db.commit()

    return {"message": "Embedding saved", "image_path": f"/images/{filename}"}


# ── Static file mounts ─────────────────────────────────────────────────────

class _CORSStaticFiles(StaticFiles):
    """StaticFiles that adds CORS headers (needed for findSimilar fetch)."""
    async def get_response(self, path: str, scope) -> FileResponse:
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

images_dir = Path(__file__).resolve().parent.parent / "static" / "images"
if images_dir.is_dir():
    app.mount("/images", _CORSStaticFiles(directory=str(images_dir)), name="images")

frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
