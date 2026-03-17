from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.auth.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class CurrentUser:
    """Lightweight representation of the authenticated user extracted from JWT claims."""

    def __init__(self, sub: str, role: str, company_ids: list[str]) -> None:
        self.sub = sub
        self.role = role
        self.company_ids = company_ids

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_managing_partner(self) -> bool:
        return self.role == "managing_partner"


async def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    """
    FastAPI dependency that decodes and validates the Bearer JWT.

    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload: dict[str, Any] = decode_access_token(token)
        sub: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        company_ids: list[str] = payload.get("company_ids", [])

        if sub is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    return CurrentUser(sub=sub, role=role, company_ids=company_ids)


async def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    FastAPI dependency that ensures the caller has the `admin` role.

    Raises HTTP 403 for non-admin callers.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
