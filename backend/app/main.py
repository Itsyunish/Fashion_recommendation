"""FastAPI app entry point — lifespan, middleware, router includes, static mounts."""
import logging
import os

# Force CPU-only — assignment (not setdefault) ensures these are always set
# before any ML library is imported, preventing CUDA probing errors.
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "1"

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from app.config import settings
from app.database import async_session, init_db
from app.services.feature_extractor import get_model
from app.services.store_repo import seed_inventory, seed_stores

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Initialize DB tables and preload models on startup."""
    await init_db()
    get_model()
    if settings.ENABLE_FINE_TUNE:
        from app.services.fine_tune_extractor import get_fine_tune_model
        if get_fine_tune_model() is None:
            logger.warning(
                "Fine-tuned model not available. "
                "Fine-tune endpoints will return errors until the model file is available."
            )
    try:
        async with async_session() as session:
            await seed_stores(session)
            await seed_inventory(session)
    except Exception:
        logger.warning("Could not seed store data (tables may not exist yet). Run POST /api/stores/seed manually.")
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

# ── Router includes ─────────────────────────────────────────────────────

from app.routes import auth, browse, config, recommend, stores

app.include_router(auth.router)
app.include_router(browse.router)
app.include_router(recommend.router)
app.include_router(config.router)
app.include_router(stores.router)

if settings.ENABLE_FINE_TUNE:
    from app.routes import fine_tune
    app.include_router(fine_tune.router)

# ── Static file mounts ─────────────────────────────────────────────────


class _CORSStaticFiles(StaticFiles):
    """StaticFiles that adds CORS headers (needed for findSimilar fetch)."""
    async def get_response(self, path: str, scope) -> FileResponse:
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response


_app_root = Path(__file__).resolve().parent.parent  # /app (Docker) or .../backend
_project_root = _app_root.parent  # / (Docker) or .../capstone_project
_images_candidates = [
    _app_root / "static" / "images",                                    # Docker: /app/static/images
    _project_root / "data_2" / "archive (1)" / "fashion-dataset" / "images",  # local dev
    _project_root / "backend" / "static" / "images",                    # local dev fallback
]
images_dir = next((d for d in _images_candidates if d.is_dir() and any(d.iterdir())), None)
if images_dir is not None:
    app.mount("/images", _CORSStaticFiles(directory=str(images_dir)), name="images")

frontend_dir = _project_root / "frontend" / "dist"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
else:
    frontend_dir = _project_root / "frontend"
    if frontend_dir.is_dir():
        app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
