from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user
from app.schemas.assignment import AssignmentResponse
from app.schemas.contract import ContractResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardMetrics(BaseModel):
    active_freelancers: int
    active_employees: int
    upcoming_expirations: int
    recent_contracts: list[ContractResponse]
    expiring_assignments: list[AssignmentResponse]


@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics(
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> DashboardMetrics:
    """Return key dashboard metrics."""
    now = datetime.now(timezone.utc)
    in_30_days = now + timedelta(days=30)

    company_filter: dict = {}
    if current_user.is_managing_partner and current_user.company_ids:
        company_filter = {"companyId": {"in": current_user.company_ids}}

    active_freelancers = await db.freelanceprofile.count(
        where={"status": "active", **company_filter}
    )
    active_employees = await db.employeeprofile.count(
        where={"status": "active", **company_filter}
    )

    contract_company_filter: dict = {}
    if current_user.is_managing_partner and current_user.company_ids:
        contract_company_filter = {"consultancyCompanyId": {"in": current_user.company_ids}}

    upcoming_expirations = await db.contract.count(
        where={
            "status": "active",
            "endDate": {"gte": now, "lte": in_30_days},
            **contract_company_filter,
        }
    )

    recent_contracts_raw = await db.contract.find_many(
        where=contract_company_filter or {},
        order={"createdAt": "desc"},
        take=5,
    )
    recent_contracts = [ContractResponse.from_orm_map(r) for r in recent_contracts_raw]

    assignment_company_filter: dict = {}
    if current_user.is_managing_partner and current_user.company_ids:
        assignment_company_filter = {
            "OR": [
                {"contract": {"is": {"consultancyCompanyId": {"in": current_user.company_ids}}}},
                {"contractId": None},
            ]
        }

    expiring_assignments_raw = await db.assignment.find_many(
        where={
            "status": "active",
            "endDate": {"gte": now, "lte": in_30_days},
            **assignment_company_filter,
        },
        order={"endDate": "asc"},
    )
    expiring_assignments = [AssignmentResponse.from_orm_map(r) for r in expiring_assignments_raw]

    return DashboardMetrics(
        active_freelancers=active_freelancers,
        active_employees=active_employees,
        upcoming_expirations=upcoming_expirations,
        recent_contracts=recent_contracts,
        expiring_assignments=expiring_assignments,
    )
