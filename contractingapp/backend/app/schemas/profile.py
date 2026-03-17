from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Freelance Profile
# ---------------------------------------------------------------------------

class FreelanceCreate(BaseModel):
    company_id: str
    first_name: str
    last_name: str
    fixed: bool = False
    status: Literal["active", "inactive"] = "active"


class FreelanceUpdate(BaseModel):
    company_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    fixed: bool | None = None
    status: Literal["active", "inactive"] | None = None


class ContractSummary(BaseModel):
    id: str
    name: str
    purchase_rate: float
    status: str
    start_date: datetime
    end_date: datetime


class AssignmentSummary(BaseModel):
    id: str
    timesheet_code: str
    client_tariff: float
    tariff_type: str
    status: str
    start_date: datetime
    end_date: datetime


class FreelanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    first_name: str
    last_name: str
    fixed: bool
    status: str
    created_at: datetime
    updated_at: datetime
    contracts: list[ContractSummary] = []

    @classmethod
    def from_orm_map(cls, obj: object, include_contracts: bool = False) -> "FreelanceResponse":
        contracts: list[ContractSummary] = []
        if include_contracts:
            raw = getattr(obj, "contracts", None) or []
            contracts = [
                ContractSummary(
                    id=c.id,
                    name=c.name,
                    purchase_rate=float(c.purchaseRate),
                    status=c.status,
                    start_date=c.startDate,
                    end_date=c.endDate,
                )
                for c in raw
            ]
        return cls(
            id=getattr(obj, "id"),
            company_id=getattr(obj, "companyId"),
            first_name=getattr(obj, "firstName"),
            last_name=getattr(obj, "lastName"),
            fixed=getattr(obj, "fixed"),
            status=getattr(obj, "status"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
            contracts=contracts,
        )


# ---------------------------------------------------------------------------
# Employee Profile
# ---------------------------------------------------------------------------

class EmployeeCreate(BaseModel):
    company_id: str
    first_name: str
    last_name: str
    cronos_cost_price_220d: float
    cronos_cost_price_180d: float
    status: Literal["active", "inactive"] = "active"


class EmployeeUpdate(BaseModel):
    company_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    cronos_cost_price_220d: float | None = None
    cronos_cost_price_180d: float | None = None
    status: Literal["active", "inactive"] | None = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    first_name: str
    last_name: str
    cronos_cost_price_220d: float
    cronos_cost_price_180d: float
    status: str
    created_at: datetime
    updated_at: datetime
    assignments: list[AssignmentSummary] = []

    @classmethod
    def from_orm_map(cls, obj: object, include_assignments: bool = False) -> "EmployeeResponse":
        assignments: list[AssignmentSummary] = []
        if include_assignments:
            raw = getattr(obj, "assignments", None) or []
            assignments = [
                AssignmentSummary(
                    id=a.id,
                    timesheet_code=a.timesheetCode,
                    client_tariff=float(a.clientTariff),
                    tariff_type=a.tariffType,
                    status=a.status,
                    start_date=a.startDate,
                    end_date=a.endDate,
                )
                for a in raw
            ]
        return cls(
            id=getattr(obj, "id"),
            company_id=getattr(obj, "companyId"),
            first_name=getattr(obj, "firstName"),
            last_name=getattr(obj, "lastName"),
            cronos_cost_price_220d=float(getattr(obj, "cronosCostPrice220d")),
            cronos_cost_price_180d=float(getattr(obj, "cronosCostPrice180d")),
            status=getattr(obj, "status"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
            assignments=assignments,
        )
