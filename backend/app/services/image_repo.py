"""Database operations for the embeddings table."""
import csv
import json
from functools import lru_cache
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Embedding, FineTuneEmbedding

_styles: dict[str, dict] | None = None
_json_dir: Path | None = None


def _load_styles() -> dict[str, dict]:
    global _styles
    if _styles is not None:
        return _styles

    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        root / "data_2" / "archive (1)" / "fashion-dataset" / "styles.csv",
        Path("/app/static/styles.csv"),
    ]
    for p in candidates:
        if p.exists():
            _styles = {}
            with open(p, newline="", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    _styles[row["id"]] = {
                        "article_type": row.get("articleType", ""),
                        "base_colour": row.get("baseColour", ""),
                        "season": row.get("season", ""),
                        "product_display_name": row.get("productDisplayName", None),
                        "gender": row.get("gender", None),
                        "master_category": row.get("masterCategory", None),
                        "sub_category": row.get("subCategory", None),
                        "usage": row.get("usage", None),
                        "year": row.get("year", None),
                    }
            break
    return _styles or {}


def _get_json_dir() -> Path | None:
    global _json_dir
    if _json_dir is not None:
        return _json_dir
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        root / "data_2" / "archive (1)" / "fashion-dataset" / "styles",
        Path("/app/static/styles"),
    ]
    for p in candidates:
        if p.is_dir():
            _json_dir = p
            break
    return _json_dir


@lru_cache(maxsize=2048)
def _load_json_style(image_id: str) -> dict | None:
    d = _get_json_dir()
    if d is None:
        return None
    p = d / f"{image_id}.json"
    if not p.exists():
        return None
    try:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None
    item = data.get("data") or data
    if not isinstance(item, dict):
        return None
    attrs = item.get("articleAttributes") or {}
    if isinstance(attrs, dict):
        attrs = {k.lower().replace(" ", "_"): v for k, v in attrs.items()}
    cat = item.get("masterCategory") or {}
    sub = item.get("subCategory") or {}
    art = item.get("articleType") or {}
    return {
        "product_display_name": item.get("productDisplayName") or None,
        "brand_name": item.get("brandName") or None,
        "price": _as_float(item.get("price")),
        "discounted_price": _as_float(item.get("discountedPrice")),
        "rating": _as_float(item.get("myntraRating")),
        "gender": item.get("gender") or None,
        "base_colour": item.get("baseColour") or None,
        "season": item.get("season") or None,
        "year": item.get("year") or None,
        "usage": item.get("usage") or None,
        "master_category": cat.get("typeName") if isinstance(cat, dict) else None,
        "sub_category": sub.get("typeName") if isinstance(sub, dict) else None,
        "article_type": art.get("typeName") if isinstance(art, dict) else None,
        "article_attributes": attrs or None,
    }


def _as_float(v: object) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def get_style_by_image_path(image_path: str) -> dict | None:
    image_id = Path(image_path).stem
    csv_style = _load_styles().get(image_id)
    json_style = _load_json_style(image_id)
    if csv_style is None and json_style is None:
        return None
    merged = dict(csv_style or {})
    if json_style:
        merged.update({k: v for k, v in json_style.items() if v is not None and v != ""})
    return merged


def find_csv() -> Path | None:
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        Path("/app/embeddings.csv"),
        root / "embeddings_3.csv",
        root / "embeddings.csv",
        Path("embeddings.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


async def get_embedding_count(db: AsyncSession) -> int:
    count = await db.scalar(select(func.count(Embedding.id)))
    return count or 0


async def seed_from_csv(db: AsyncSession, csv_path: str) -> int:
    total = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            embedding = json.loads(row["embedding"])
            db.add(Embedding(image_path=row["image_path"], embedding=embedding))
            total += 1
            if total % 500 == 0:
                await db.flush()
        await db.commit()
    return total


def find_fine_tune_csv() -> Path | None:
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        Path(settings.FINE_TUNE_EMBED_PATH),
        root / settings.FINE_TUNE_EMBED_PATH,
        Path("/app/fine_tuned_model/best_embeddings.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


async def get_fine_tune_embedding_count(db: AsyncSession) -> int:
    count = await db.scalar(select(func.count(FineTuneEmbedding.id)))
    return count or 0


async def seed_fine_tune_from_csv(db: AsyncSession, csv_path: str) -> int:
    total = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            embedding = json.loads(row["embedding"])
            db.add(FineTuneEmbedding(image_path=row["image_path"], embedding=embedding))
            total += 1
            if total % 500 == 0:
                await db.flush()
        await db.commit()
    return total
