"""Auth endpoints — signup, login, logout, profile management (JWT-based)."""
import datetime
from typing import Any

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    SignupRequest,
    UpdateProfileRequest,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = settings.SESSION_MAX_AGE  # 7 days


def _create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=COOKIE_MAX_AGE),
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, settings.SESSION_SECRET_KEY, algorithm="HS256")


def _set_token_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
    )


def _clear_token_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Dependency: extract user from JWT cookie or raise 401."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(409, "Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _create_token(user.id)
    _set_token_cookie(response, token)

    return AuthResponse(
        message="Account created successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid email or password")

    token = _create_token(user.id)
    _set_token_cookie(response, token)

    return AuthResponse(
        message="Logged in successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.post("/logout")
async def logout(response: Response) -> dict:
    _clear_token_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=current_user.id, username=current_user.username, email=current_user.email)


@router.delete("/me")
async def delete_account(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    await db.delete(current_user)
    await db.commit()
    _clear_token_cookie(response)
    return {"message": "Account deleted"}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not bcrypt.checkpw(body.old_password.encode(), current_user.password_hash.encode()):
        raise HTTPException(400, "Current password is incorrect")
    current_user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    await db.commit()
    return {"message": "Password changed successfully"}


@router.put("/me", response_model=AuthResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuthResponse:
    if body.username is not None:
        result = await db.execute(select(User).where(User.username == body.username, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Username already taken")
        current_user.username = body.username
    if body.email is not None:
        result = await db.execute(select(User).where(User.email == body.email, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Email already taken")
        current_user.email = body.email
    await db.commit()
    return AuthResponse(
        message="Profile updated",
        user=UserOut(id=current_user.id, username=current_user.username, email=current_user.email),
    )
