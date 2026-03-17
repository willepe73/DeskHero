from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import settings


def create_access_token(
    subject: str,
    role: str,
    company_ids: list[str],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token with sub, role, and company_ids claims."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "company_ids": company_ids,
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.

    Raises:
        JWTError: if the token is invalid or expired.

    Returns:
        The decoded payload dict.
    """
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )
    return payload
