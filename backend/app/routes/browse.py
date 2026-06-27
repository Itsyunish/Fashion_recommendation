"""Browse catalog — search, filter, paginate products."""
from pathlib import Path

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.image_repo import _load_styles, _get_json_dir, _load_json_style

router = APIRouter(tags=["browse"])


class ProductItem(BaseModel):
    id: str
    product_display_name: str | None = None
    brand_name: str | None = None
    article_type: str | None = None
    base_colour: str | None = None
    gender: str | None = None
    master_category: str | None = None
    sub_category: str | None = None
    usage: str | None = None
    price: float | None = None
    discounted_price: float | None = None
    rating: float | None = None
    image_path: str | None = None


class BrowseResponse(BaseModel):
    products: list[ProductItem]
    total: int
    page: int
    limit: int
    categories: list[str]


def _get_images_base_url() -> str:
    root = Path(__file__).resolve().parent.parent.parent.parent
    candidates = [
        root / "data_2" / "archive (1)" / "fashion-dataset" / "images",
        Path("/app/static/images"),
    ]
    for d in candidates:
        if d.is_dir():
            return f"/images/"
    return "/images/"


@router.get("/api/products", response_model=BrowseResponse)
async def browse_products(
    search: str = Query("", max_length=100),
    category: str = Query("", max_length=50),
    page: int = Query(1, ge=1, le=1000),
    limit: int = Query(20, ge=1, le=100),
) -> BrowseResponse:
    styles = _load_styles()
    items: list[ProductItem] = []
    search_lower = search.strip().lower()

    for pid, info in styles.items():
        name = (info.get("product_display_name") or "").lower()
        article = (info.get("article_type") or "").lower()
        brand = ""
        json_data = _load_json_style(pid)
        if json_data:
            brand = (json_data.get("brand_name") or "").lower()

        if search_lower:
            if search_lower not in name and search_lower not in article and search_lower not in brand:
                continue

        if category:
            cat_lower = category.lower()
            if cat_lower != (info.get("article_type") or "").lower() and \
               cat_lower != (info.get("master_category") or "").lower() and \
               cat_lower != (info.get("sub_category") or "").lower():
                continue

        price = None
        discounted_price = None
        rating = None
        brand_name = None
        if json_data:
            try:
                price = float(json_data["price"]) if json_data.get("price") else None
            except (ValueError, TypeError):
                pass
            try:
                discounted_price = float(json_data["discounted_price"]) if json_data.get("discounted_price") else None
            except (ValueError, TypeError):
                pass
            try:
                rating = float(json_data["rating"]) if json_data.get("rating") else None
            except (ValueError, TypeError):
                pass
            brand_name = json_data.get("brand_name") or None

        items.append(ProductItem(
            id=pid,
            product_display_name=info.get("product_display_name") or None,
            brand_name=brand_name,
            article_type=info.get("article_type") or None,
            base_colour=info.get("base_colour") or None,
            gender=info.get("gender") or None,
            master_category=info.get("master_category") or None,
            sub_category=info.get("sub_category") or None,
            usage=info.get("usage") or None,
            price=price,
            discounted_price=discounted_price,
            rating=rating,
            image_path=f"{_get_images_base_url()}{pid}.jpg",
        ))

    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    page_items = items[start:end]

    categories = sorted(set(
        s.get("article_type") for s in styles.values() if s.get("article_type")
    ))

    return BrowseResponse(
        products=page_items,
        total=total,
        page=page,
        limit=limit,
        categories=categories,
    )


class SuggestionItem(BaseModel):
    id: str
    text: str
    type: str


class SuggestionsResponse(BaseModel):
    suggestions: list[SuggestionItem]


@router.get("/api/products/suggestions", response_model=SuggestionsResponse)
async def product_suggestions(
    q: str = Query("", max_length=50),
) -> SuggestionsResponse:
    if not q.strip():
        return SuggestionsResponse(suggestions=[])

    styles = _load_styles()
    q_lower = q.strip().lower()
    suggestions: list[SuggestionItem] = []
    seen: set[str] = set()

    for pid, info in styles.items():
        if len(suggestions) >= 8:
            break

        name = info.get("product_display_name") or ""
        article = info.get("article_type") or ""
        brand = ""
        json_data = _load_json_style(pid)
        if json_data:
            brand = json_data.get("brand_name") or ""

        for text, typ in [(name, "product"), (article, "category"), (brand, "brand")]:
            if text and q_lower in text.lower() and text.lower() not in seen:
                seen.add(text.lower())
                suggestions.append(SuggestionItem(id=pid, text=text, type=typ))
                if len(suggestions) >= 8:
                    break

    return SuggestionsResponse(suggestions=suggestions)
