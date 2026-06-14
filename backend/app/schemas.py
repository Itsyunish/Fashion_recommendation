"""Pydantic models for request/response validation."""
from pydantic import BaseModel, EmailStr, field_validator


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


class SignupRequest(BaseModel):
    """User registration payload."""

    username: str
    email: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Username is required")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email address")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    """User login payload."""

    email: str
    password: str


class UserOut(BaseModel):
    """Public user info returned to the client."""

    id: int
    username: str
    email: str


class AuthResponse(BaseModel):
    """Response returned after signup or login with a friendly message."""

    message: str
    user: UserOut


class ChangePasswordRequest(BaseModel):
    """Payload to change the current user's password."""

    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UpdateProfileRequest(BaseModel):
    """Payload to update username and/or email."""

    username: str | None = None
    email: str | None = None


class FineTuneCompareItem(BaseModel):
    """A single recommendation result from one model (base or fine-tuned)."""

    model_type: str  # "base" or "fine_tune"
    similarity_score: float
    image_path: str
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


class CompareResponse(BaseModel):
    """Response with recommendations from both base and fine-tuned models."""

    query_image: str
    base_recommendations: list[FineTuneCompareItem]
    fine_tune_recommendations: list[FineTuneCompareItem]
