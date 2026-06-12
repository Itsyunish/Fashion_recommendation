"""FastAPI app entry point with all endpoints defined inline."""
import os

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
import bcrypt
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import FileResponse

from app.config import settings
from app.database import get_db, init_db
from app.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RecommendResponse,
    RecommendationOut,
    SignupRequest,
    UpdateProfileRequest,
    UserOut,
)
from app.services.feature_extractor import extract_features, get_model
from app.services.image_repo import find_csv, get_embedding_count, get_style_by_image_path, seed_from_csv
from app.models import Embedding, User
from app.services.similarity import find_similar

ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Initialize DB tables and preload the TF model on startup."""
    await init_db()
    get_model()
    yield


app = FastAPI(
    title="PixelCloset",
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

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=settings.SESSION_MAX_AGE,
    same_site="lax",
    https_only=False,
)

# ── Auth helpers ──────────────────────────────────────────────────────────


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Dependency that returns the authenticated user or raises 401."""
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Auth Endpoints ────────────────────────────────────────────────────────


@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Register a new user account."""
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(409, "Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    request.session["user_id"] = user.id
    return AuthResponse(
        message="Account created successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Authenticate a user and create a session."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid email or password")

    request.session["user_id"] = user.id
    return AuthResponse(
        message="Logged in successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@app.post("/api/auth/logout")
async def logout(request: Request) -> dict:
    """Clear the user session."""
    request.session.clear()
    return {"message": "Logged out"}


@app.get("/api/auth/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Return the currently authenticated user's info."""
    return UserOut(id=current_user.id, username=current_user.username, email=current_user.email)


@app.delete("/api/auth/me")
async def delete_account(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete the authenticated user's account."""
    await db.delete(current_user)
    await db.commit()
    request.session.clear()
    return {"message": "Account deleted"}


@app.post("/api/auth/change-password")
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Change the authenticated user's password."""
    if not bcrypt.checkpw(body.old_password.encode(), current_user.password_hash.encode()):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    await db.commit()
    return {"message": "Password changed successfully"}


@app.put("/api/auth/me", response_model=AuthResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuthResponse:
    """Update the authenticated user's username and/or email."""
    if body.username is not None:
        result = await db.execute(select(User).where(User.username == body.username, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Username already taken")
        current_user.username = body.username
    if body.email is not None:
        result = await db.execute(select(User).where(User.email == body.email, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Email already registered")
        current_user.email = body.email
    await db.commit()
    return AuthResponse(
        message="Profile updated",
        user=UserOut(id=current_user.id, username=current_user.username, email=current_user.email),
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

_root = Path(__file__).resolve().parent.parent.parent
_images_candidates = [
    _root / "data_2" / "archive (1)" / "fashion-dataset" / "images",
    _root / "backend" / "static" / "images",
]
images_dir = next((d for d in _images_candidates if d.is_dir()), None)
if images_dir is not None:
    app.mount("/images", _CORSStaticFiles(directory=str(images_dir)), name="images")

frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
