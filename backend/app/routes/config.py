"""Config endpoint — exposes non-sensitive settings to the frontend."""
import json
import os
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["config"])

_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "runtime_config.json"


def _load_runtime() -> dict:
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH) as f:
            return json.load(f)
    return {}


def _save_runtime(data: dict) -> None:
    with open(_CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_enable_fine_tune() -> bool:
    rt = _load_runtime()
    return rt.get("enable_fine_tune", settings.ENABLE_FINE_TUNE)


class ToggleFineTuneRequest(BaseModel):
    enabled: bool


@router.get("/api/config")
async def get_config() -> dict:
    """Expose non-sensitive config to the frontend."""
    return {
        "enable_fine_tune": get_enable_fine_tune(),
        "use_keras": settings.USE_KERAS,
    }


@router.post("/api/config/fine-tune")
async def toggle_fine_tune(req: ToggleFineTuneRequest) -> dict:
    """Toggle the fine-tune feature on or off."""
    rt = _load_runtime()
    rt["enable_fine_tune"] = req.enabled
    _save_runtime(rt)
    return {"enable_fine_tune": req.enabled, "message": f"Fine-tune {'enabled' if req.enabled else 'disabled'}"}
