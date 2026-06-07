"""Pydantic models for request/response validation."""
from pydantic import BaseModel


class RecommendationOut(BaseModel):
    """A single recommended item with its image path and similarity score."""

    image_path: str
    similarity_score: float


class RecommendResponse(BaseModel):
    """Response returned after uploading a query image."""

    query_image: str
    recommendations: list[RecommendationOut]
