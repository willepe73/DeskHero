from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class AssignmentBrief(BaseModel):
    id: str
    timesheet_code: str
    status: str
    start_date: datetime
    end_date: datetime | None = None


class ContractCreate(BaseModel):
    name: str
    consultancy_company_id: str
    freelance_id: str
    purchase_rate: float
    start_date: datetime
    end_date: datetime
    remarks: str | None = None
    status: Literal["active", "terminated"] = "active"


class ContractUpdate(BaseModel):
    name: str | None = None
    consultancy_company_id: str | None = None
    freelance_id: str | None = None
    purchase_rate: float | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    remarks: str | None = None
    status: Literal["active", "terminated"] | None = None


class ContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    consultancy_company_id: str
    freelance_id: str
    purchase_rate: float
    start_date: datetime
    end_date: datetime
    pdf_blob_storage_id: str | None = None
    remarks: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    assignments: list[AssignmentBrief] = []

    @classmethod
    def from_orm_map(cls, obj: object, include_assignments: bool = False) -> "ContractResponse":
        assignments: list[AssignmentBrief] = []
        if include_assignments:
            raw = getattr(obj, "assignments", None) or []
            assignments = [
                AssignmentBrief(
                    id=a.id,
                    timesheet_code=a.timesheetCode,
                    status=a.status,
                    start_date=a.startDate,
                    end_date=a.endDate,
                )
                for a in raw
            ]
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            consultancy_company_id=getattr(obj, "consultancyCompanyId"),
            freelance_id=getattr(obj, "freelanceId"),
            purchase_rate=float(getattr(obj, "purchaseRate")),
            start_date=getattr(obj, "startDate"),
            end_date=getattr(obj, "endDate"),
            pdf_blob_storage_id=getattr(obj, "pdfBlobStorageId"),
            remarks=getattr(obj, "remarks"),
            status=getattr(obj, "status"),
            created_at=getattr(obj, "createdAt"),
            updated_at=getattr(obj, "updatedAt"),
            assignments=assignments,
        )


class PdfUrlResponse(BaseModel):
    pdf_url: str | None
    filename: str | None
