"""Pydantic models for request/response validation."""
from pydantic import BaseModel


class RecommendationOut(BaseModel):
    """A single recommended item with its image path, score, and optional metadata."""

    image_path: str
    similarity_score: float
    article_type: str | None = None
    base_colour: str | None = None
    season: str | None = None
    product_display_name: str | None = None
    brand_name: str | None = None
    price: float | None = None
    discounted_price: float | None = None
    rating: float | None = None
    gender: str | None = None
    master_category: str | None = None
    sub_category: str | None = None
    usage: str | None = None
    year: str | None = None
    article_attributes: dict | None = None


class RecommendResponse(BaseModel):
    """Response returned after uploading a query image."""

    query_image: str
    recommendations: list[RecommendationOut]
