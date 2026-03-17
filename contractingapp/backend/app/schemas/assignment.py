from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator


class AssignmentCreate(BaseModel):
    contract_id: str | None = None
    employee_id: str | None = None
    client_id: str
    end_client_id: str
    timesheet_code: str
    start_date: datetime
    end_date: datetime
    client_tariff: float
    end_tariff: float | None = None
    tariff_type: Literal["percentage", "50_50", "end_tariff"]
    remarks: str | None = None
    status: Literal["active", "completed", "cancelled"] = "active"

    @model_validator(mode="after")
    def check_exactly_one_subject(self) -> "AssignmentCreate":
        has_contract = self.contract_id is not None
        has_employee = self.employee_id is not None
        if has_contract == has_employee:
            raise ValueError("Exactly one of contract_id or employee_id must be provided")
        return self


class AssignmentUpdate(BaseModel):
    contract_id: str | None = None
    employee_id: str | None = None
    client_id: str | None = None
    end_client_id: str | None = None
    timesheet_code: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    client_tariff: float | None = None
    end_tariff: float | None = None
    tariff_type: Literal["percentage", "50_50", "end_tariff"] | None = None
    remarks: str | None = None
    status: Literal["active", "completed", "cancelled"] | None = None


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contract_id: str | None = None
    employee_id: str | None = None
    client_id: str
    end_client_id: str
    timesheet_code: str
    start_date: datetime
    end_date: datetime
    client_tariff: float
    end_tariff: float | None = None
    tariff_type: str
    remarks: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_map(cls, obj: object) -> "AssignmentResponse":
        end_tariff_raw = getattr(obj, "endTariff", None)
        return cls(
            id=getattr(obj, "id"),
            contract_id=getattr(obj, "contractId", None),
            employee_id=getattr(obj, "employeeId", None),
            client_id=getattr(obj, "clientId"),
            end_client_id=getattr(obj, "endClientId"),
            timesheet_code=getattr(obj, "timesheetCode"),
            start_date=getattr(obj, "startDate"),
            end_date=getattr(obj, "endDate"),
            client_tariff=float(getattr(obj, "clientTariff")),
            end_tariff=float(end_tariff_raw) if end_tariff_raw is not None else None,
            tariff_type=getattr(obj, "tariffType"),
            remarks=getattr(obj, "remarks"),
            status=getattr(obj, "status"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
        )
