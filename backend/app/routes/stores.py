"""Store listing and seeding endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import StoreListResponse, StoreOut
from app.services.store_repo import get_all_stores, get_store_count, seed_inventory, seed_stores

router = APIRouter(tags=["stores"])


@router.get("/api/stores", response_model=StoreListResponse)
async def list_stores(db: AsyncSession = Depends(get_db)) -> StoreListResponse:
    stores = await get_all_stores(db)
    return StoreListResponse(stores=[StoreOut(**s) for s in stores])


@router.get("/api/stores/status")
async def stores_status(db: AsyncSession = Depends(get_db)) -> dict:
    count = await get_store_count(db)
    return {"seeded": count > 0, "count": count}


@router.post("/api/stores/seed")
async def seed_store_data(db: AsyncSession = Depends(get_db)) -> dict:
    store_count = await seed_stores(db)
    inv_count = await seed_inventory(db)
    return {
        "message": f"Seeded {store_count} stores and {inv_count} inventory entries",
    }


@router.post("/api/stores/migrate")
async def migrate_stores(db: AsyncSession = Depends(get_db)) -> dict:
    """Add categories column and reset stores for re-seeding (category-based, no inventory)."""
    await db.execute(text("ALTER TABLE stores ADD COLUMN IF NOT EXISTS categories TEXT"))
    await db.execute(text("ALTER TABLE stores ALTER COLUMN latitude DROP NOT NULL"))
    await db.execute(text("ALTER TABLE stores ALTER COLUMN longitude DROP NOT NULL"))
    await db.execute(text("DELETE FROM store_inventory"))
    await db.execute(text("DELETE FROM stores"))
    await db.commit()
    store_count = await seed_stores(db)
    return {
        "message": f"Migration complete. Seeded {store_count} category-based stores (no inventory mapping needed)",
    }
