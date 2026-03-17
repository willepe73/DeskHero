from prisma import Prisma

# Module-level Prisma client instance shared across the application lifetime.
prisma = Prisma()


async def get_db() -> Prisma:  # type: ignore[return]
    """FastAPI dependency that yields the connected Prisma client."""
    yield prisma
