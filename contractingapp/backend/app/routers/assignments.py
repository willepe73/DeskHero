from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from app.schemas.common import PaginatedResponse, paginate

router = APIRouter(prefix="/assignments", tags=["assignments"])


async def _get_assignment_or_404(assignment_id: str, db: Prisma):
    """Fetch an assignment by ID or raise 404."""
    record = await db.assignment.find_unique(where={"id": assignment_id})
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return record


async def _check_contract_access(contract_id: str, current_user: CurrentUser, db: Prisma):
    """Verify the contract exists and the user has access to it."""
    contract = await db.contract.find_unique(where={"id": contract_id})
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if current_user.is_managing_partner and contract.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return contract


@router.get("", response_model=PaginatedResponse[AssignmentResponse])
async def list_assignments(
    search: str | None = None,
    timesheet_code: str | None = None,
    contract_id: str | None = None,
    employee_id: str | None = None,
    client_id: str | None = None,
    end_client_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[AssignmentResponse]:
    """
    List assignments with optional search/filter and pagination.

    managing_partner is scoped to assignments belonging to contracts under their company_ids.
    """
    where: dict = {}

    if timesheet_code:
        where["timesheetCode"] = timesheet_code
    if contract_id:
        where["contractId"] = contract_id
    if employee_id:
        where["employeeId"] = employee_id
    if client_id:
        where["clientId"] = client_id
    if end_client_id:
        where["endClientId"] = end_client_id
    if status:
        where["status"] = status
    if search:
        where["timesheetCode"] = {"contains": search}

    if current_user.is_managing_partner:
        if not current_user.company_ids:
            return PaginatedResponse[AssignmentResponse](**paginate([], 0, page, size))
        # Include assignments linked to accessible contracts OR directly to employees (no contract)
        where["OR"] = [
            {"contract": {"is": {"consultancyCompanyId": {"in": current_user.company_ids}}}},
            {"contractId": None},
        ]

    skip = (page - 1) * size
    total = await db.assignment.count(where=where)
    records = await db.assignment.find_many(
        where=where,
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [AssignmentResponse.from_orm_map(r) for r in records]
    return PaginatedResponse[AssignmentResponse](**paginate(items, total, page, size))


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> AssignmentResponse:
    """Create a new assignment."""
    if payload.contract_id:
        await _check_contract_access(payload.contract_id, current_user, db)
    else:
        employee = await db.employeeprofile.find_unique(where={"id": payload.employee_id})
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Verify client and end-client exist
    client = await db.client.find_unique(where={"id": payload.client_id})
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    end_client = await db.client.find_unique(where={"id": payload.end_client_id})
    if end_client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="End client not found")

    create_data: dict = {
        "clientId": payload.client_id,
        "endClientId": payload.end_client_id,
        "timesheetCode": payload.timesheet_code,
        "startDate": payload.start_date,
        "clientTariff": payload.client_tariff,
        "tariffType": payload.tariff_type,
        "status": payload.status,
    }
    if payload.contract_id:
        create_data["contractId"] = payload.contract_id
    if payload.employee_id:
        create_data["employeeId"] = payload.employee_id
    if payload.end_date:
        create_data["endDate"] = payload.end_date
    if payload.end_tariff is not None:
        create_data["endTariff"] = payload.end_tariff
    if payload.remarks:
        create_data["remarks"] = payload.remarks

    record = await db.assignment.create(data=create_data)
    return AssignmentResponse.from_orm_map(record)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> AssignmentResponse:
    """Retrieve a single assignment by ID."""
    record = await _get_assignment_or_404(assignment_id, db)

    if current_user.is_managing_partner and record.contractId:
        await _check_contract_access(record.contractId, current_user, db)

    return AssignmentResponse.from_orm_map(record)


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> AssignmentResponse:
    """Update an assignment."""
    existing = await _get_assignment_or_404(assignment_id, db)

    if current_user.is_managing_partner and existing.contractId:
        await _check_contract_access(existing.contractId, current_user, db)

    update_data: dict = {}
    if payload.contract_id is not None:
        update_data["contractId"] = payload.contract_id
    if payload.employee_id is not None:
        update_data["employeeId"] = payload.employee_id
    if payload.client_id is not None:
        update_data["clientId"] = payload.client_id
    if payload.end_client_id is not None:
        update_data["endClientId"] = payload.end_client_id
    if payload.timesheet_code is not None:
        update_data["timesheetCode"] = payload.timesheet_code
    if payload.start_date is not None:
        update_data["startDate"] = payload.start_date
    if payload.end_date is not None:
        update_data["endDate"] = payload.end_date
    if payload.client_tariff is not None:
        update_data["clientTariff"] = payload.client_tariff
    if payload.end_tariff is not None:
        update_data["endTariff"] = payload.end_tariff
    if payload.tariff_type is not None:
        update_data["tariffType"] = payload.tariff_type
    if payload.remarks is not None:
        update_data["remarks"] = payload.remarks
    if payload.status is not None:
        update_data["status"] = payload.status

    if not update_data:
        return AssignmentResponse.from_orm_map(existing)

    record = await db.assignment.update(where={"id": assignment_id}, data=update_data)
    return AssignmentResponse.from_orm_map(record)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete an assignment."""
    existing = await _get_assignment_or_404(assignment_id, db)

    if current_user.is_managing_partner and existing.contractId:
        await _check_contract_access(existing.contractId, current_user, db)

    await db.assignment.delete(where={"id": assignment_id})
