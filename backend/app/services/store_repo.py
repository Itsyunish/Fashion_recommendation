"""Store and inventory data operations."""
import csv
import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Store, StoreInventory

_STORE_CSV: Path | None = None


def _get_store_csv_path() -> Path | None:
    global _STORE_CSV
    if _STORE_CSV is not None:
        return _STORE_CSV
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        root / "backend" / "data" / "stores.csv",
        root / "data" / "stores.csv",
        Path("/app/data/stores.csv"),
    ]
    for p in candidates:
        if p.exists():
            _STORE_CSV = p
            return p
    return None


def _get_inventory_csv_path() -> Path | None:
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        root / "backend" / "data" / "store_inventory.csv",
        root / "data" / "store_inventory.csv",
        Path("/app/data/store_inventory.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def _safe_float(val: str | None) -> float | None:
    if not val or not val.strip():
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


async def seed_stores(db: AsyncSession) -> int:
    csv_path = _get_store_csv_path()
    if csv_path is None:
        return 0

    existing_count = await db.scalar(select(func.count(Store.id)))
    if existing_count and existing_count > 0:
        return 0

    count = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            hours_raw = row.get("opening_hours") or None
            hours = None
            if hours_raw:
                try:
                    hours = json.loads(hours_raw)
                except (json.JSONDecodeError, TypeError):
                    hours = None
            db.add(Store(
                name=row["name"],
                address=row["address"],
                city=row["city"],
                latitude=_safe_float(row.get("latitude")),
                longitude=_safe_float(row.get("longitude")),
                phone=row.get("phone") or None,
                website=row.get("website") or None,
                store_type=row.get("store_type") or None,
                opening_hours=hours,
                map_url=row.get("map_url") or None,
                categories=row.get("categories") or None,
            ))
            count += 1
        await db.commit()
    return count


async def seed_inventory(db: AsyncSession) -> int:
    csv_path = _get_inventory_csv_path()
    if csv_path is None:
        return 0

    existing_count = await db.scalar(select(func.count(StoreInventory.id)))
    if existing_count and existing_count > 0:
        return 0

    count = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            db.add(StoreInventory(
                product_id=int(row["product_id"]),
                store_id=int(row["store_id"]),
            ))
            count += 1
            if count % 500 == 0:
                await db.flush()
        await db.commit()
    return count


def _store_to_dict(s: Store) -> dict:
    map_url = s.map_url
    if not map_url and s.latitude and s.longitude:
        map_url = f"https://www.google.com/maps?q={s.latitude},{s.longitude}"
    return {
        "id": s.id,
        "name": s.name,
        "address": s.address,
        "city": s.city,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "map_url": map_url,
        "phone": s.phone,
        "website": s.website,
        "store_type": s.store_type,
        "opening_hours": s.opening_hours,
        "categories": s.categories,
    }


async def get_stores_for_product(db: AsyncSession, product_id: int, article_type: str | None = None) -> list[dict]:
    result = await db.execute(
        select(Store).join(StoreInventory, Store.id == StoreInventory.store_id)
        .where(StoreInventory.product_id == product_id)
    )
    stores = {s.id: _store_to_dict(s) for s in result.scalars().all()}

    if article_type:
        cat_result = await db.execute(select(Store))
        for s in cat_result.scalars().all():
            if s.id in stores:
                continue
            if s.categories:
                cat_list = [c.strip() for c in s.categories.split(",")]
                if article_type.strip() in cat_list:
                    stores[s.id] = _store_to_dict(s)

    return list(stores.values())


async def get_all_stores(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Store).order_by(Store.name))
    return [_store_to_dict(s) for s in result.scalars().all()]


async def get_store_count(db: AsyncSession) -> int:
    count = await db.scalar(select(func.count(Store.id)))
    return count or 0
