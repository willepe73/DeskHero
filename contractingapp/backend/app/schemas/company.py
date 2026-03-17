from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    name: str


class CompanyUpdate(BaseModel):
    name: str | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_map(cls, obj: object) -> "CompanyResponse":
        """Build from a Prisma model whose fields use camelCase."""
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
        )
