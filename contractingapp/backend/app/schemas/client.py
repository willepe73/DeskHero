from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ClientCreate(BaseModel):
    name: str
    type: Literal["intercompany", "end_client"]
    billing_address: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    type: Literal["intercompany", "end_client"] | None = None
    billing_address: str | None = None


class AssignmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timesheet_code: str
    status: str
    start_date: datetime
    end_date: datetime | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    billing_address: str | None = None
    created_at: datetime
    updated_at: datetime
    assignments: list[AssignmentSummary] = []

    @classmethod
    def from_orm_map(cls, obj: object, include_assignments: bool = False) -> "ClientResponse":
        assignments: list[AssignmentSummary] = []
        if include_assignments:
            raw = getattr(obj, "assignments", None) or []
            assignments = [
                AssignmentSummary(
                    id=a.id,
                    timesheet_code=a.timesheet_code,
                    status=a.status,
                    start_date=a.startDate,
                    end_date=a.endDate,
                )
                for a in raw
            ]
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            type=getattr(obj, "type"),
            billing_address=getattr(obj, "billingAddress"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
            assignments=assignments,
        )
