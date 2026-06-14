"""Config endpoint — exposes non-sensitive settings to the frontend."""
from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["config"])


@router.get("/api/config")
async def get_config() -> dict:
    """Expose non-sensitive config to the frontend."""
    return {
        "enable_fine_tune": settings.ENABLE_FINE_TUNE,
    }
