import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import bcrypt
from prisma import Prisma

from app.auth.jwt import create_access_token
from app.db import get_db
from app.schemas.auth import TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Prisma = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate a user and return a JWT access token.

    Accepts standard OAuth2 password form (username = email, password).
    """
    user = await db.user.find_unique(where={"email": form_data.username})

    if user is None or not verify_password(form_data.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        company_ids: list[str] = json.loads(user.companyIds)
    except (json.JSONDecodeError, TypeError):
        company_ids = []

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        company_ids=company_ids,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        company_ids=company_ids,
    )
