"""Auth endpoints — signup, login, logout, profile management."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt

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


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Dependency that returns the authenticated user or raises 401."""
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Register a new user account."""
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

    request.session["user_id"] = user.id
    return AuthResponse(
        message="Account created successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Authenticate a user and create a session."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(401, "Invalid email or password")

    request.session["user_id"] = user.id
    return AuthResponse(
        message="Logged in successfully",
        user=UserOut(id=user.id, username=user.username, email=user.email),
    )


@router.post("/logout")
async def logout(request: Request) -> dict:
    """Clear the user session."""
    request.session.clear()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Return the currently authenticated user's info."""
    return UserOut(id=current_user.id, username=current_user.username, email=current_user.email)


@router.delete("/me")
async def delete_account(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete the authenticated user's account."""
    await db.delete(current_user)
    await db.commit()
    request.session.clear()
    return {"message": "Account deleted"}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Change the authenticated user's password."""
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
    """Update the authenticated user's username and/or email."""
    if body.username is not None:
        result = await db.execute(select(User).where(User.username == body.username, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Username already taken")
        current_user.username = body.username
    if body.email is not None:
        result = await db.execute(select(User).where(User.email == body.email, User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(409, "Email already registered")
        current_user.email = body.email
    await db.commit()
    return AuthResponse(
        message="Profile updated",
        user=UserOut(id=current_user.id, username=current_user.username, email=current_user.email),
    )
