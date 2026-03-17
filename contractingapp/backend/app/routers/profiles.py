from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.profile import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    FreelanceCreate,
    FreelanceResponse,
    FreelanceUpdate,
)

router = APIRouter(prefix="", tags=["profiles"])


# ---------------------------------------------------------------------------
# Freelance profiles
# ---------------------------------------------------------------------------

@router.get("/freelancers", response_model=PaginatedResponse[FreelanceResponse])
async def list_freelance(
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[FreelanceResponse]:
    """List freelance profiles with optional search/filter and pagination."""
    where: dict = {}
    if status:
        where["status"] = status
    if search:
        where["OR"] = [
            {"firstName": {"contains": search}},
            {"lastName": {"contains": search}},
        ]

    skip = (page - 1) * size
    total = await db.freelanceprofile.count(where=where)
    records = await db.freelanceprofile.find_many(
        where=where,
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [FreelanceResponse.from_orm_map(r) for r in records]
    return PaginatedResponse[FreelanceResponse](**paginate(items, total, page, size))


@router.post("/freelancers", response_model=FreelanceResponse, status_code=status.HTTP_201_CREATED)
async def create_freelance(
    payload: FreelanceCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> FreelanceResponse:
    """Create a new freelance profile."""
    record = await db.freelanceprofile.create(
        data={
            "companyId": payload.company_id,
            "firstName": payload.first_name,
            "lastName": payload.last_name,
            "fixed": payload.fixed,
            "status": payload.status,
        }
    )
    return FreelanceResponse.from_orm_map(record)


@router.get("/freelancers/{profile_id}", response_model=FreelanceResponse)
async def get_freelance(
    profile_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> FreelanceResponse:
    """Retrieve a single freelance profile."""
    record = await db.freelanceprofile.find_unique(
        where={"id": profile_id},
        include={"contracts": True},
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelance profile not found")
    return FreelanceResponse.from_orm_map(record, include_contracts=True)


@router.put("/freelancers/{profile_id}", response_model=FreelanceResponse)
async def update_freelance(
    profile_id: str,
    payload: FreelanceUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> FreelanceResponse:
    """Update a freelance profile."""
    existing = await db.freelanceprofile.find_unique(where={"id": profile_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelance profile not found")

    update_data: dict = {}
    if payload.company_id is not None:
        update_data["companyId"] = payload.company_id
    if payload.first_name is not None:
        update_data["firstName"] = payload.first_name
    if payload.last_name is not None:
        update_data["lastName"] = payload.last_name
    if payload.fixed is not None:
        update_data["fixed"] = payload.fixed
    if payload.status is not None:
        update_data["status"] = payload.status

    if not update_data:
        return FreelanceResponse.from_orm_map(existing)

    record = await db.freelanceprofile.update(where={"id": profile_id}, data=update_data)
    return FreelanceResponse.from_orm_map(record)


@router.delete("/freelancers/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_freelance(
    profile_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete a freelance profile."""
    existing = await db.freelanceprofile.find_unique(where={"id": profile_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelance profile not found")
    await db.freelanceprofile.delete(where={"id": profile_id})


# ---------------------------------------------------------------------------
# Employee profiles
# ---------------------------------------------------------------------------

@router.get("/employees", response_model=PaginatedResponse[EmployeeResponse])
async def list_employees(
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[EmployeeResponse]:
    """List employee profiles with optional search/filter and pagination."""
    where: dict = {}
    if status:
        where["status"] = status
    if search:
        where["OR"] = [
            {"firstName": {"contains": search}},
            {"lastName": {"contains": search}},
        ]

    skip = (page - 1) * size
    total = await db.employeeprofile.count(where=where)
    records = await db.employeeprofile.find_many(
        where=where,
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [EmployeeResponse.from_orm_map(r) for r in records]
    return PaginatedResponse[EmployeeResponse](**paginate(items, total, page, size))


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> EmployeeResponse:
    """Create a new employee profile."""
    record = await db.employeeprofile.create(
        data={
            "companyId": payload.company_id,
            "firstName": payload.first_name,
            "lastName": payload.last_name,
            "cronosCostPrice220d": payload.cronos_cost_price_220d,
            "cronosCostPrice180d": payload.cronos_cost_price_180d,
            "status": payload.status,
        }
    )
    return EmployeeResponse.from_orm_map(record)


@router.get("/employees/{profile_id}", response_model=EmployeeResponse)
async def get_employee(
    profile_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> EmployeeResponse:
    """Retrieve a single employee profile."""
    record = await db.employeeprofile.find_unique(
        where={"id": profile_id},
        include={"assignments": True},
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return EmployeeResponse.from_orm_map(record, include_assignments=True)


@router.put("/employees/{profile_id}", response_model=EmployeeResponse)
async def update_employee(
    profile_id: str,
    payload: EmployeeUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> EmployeeResponse:
    """Update an employee profile."""
    existing = await db.employeeprofile.find_unique(where={"id": profile_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")

    update_data: dict = {}
    if payload.company_id is not None:
        update_data["companyId"] = payload.company_id
    if payload.first_name is not None:
        update_data["firstName"] = payload.first_name
    if payload.last_name is not None:
        update_data["lastName"] = payload.last_name
    if payload.cronos_cost_price_220d is not None:
        update_data["cronosCostPrice220d"] = payload.cronos_cost_price_220d
    if payload.cronos_cost_price_180d is not None:
        update_data["cronosCostPrice180d"] = payload.cronos_cost_price_180d
    if payload.status is not None:
        update_data["status"] = payload.status

    if not update_data:
        return EmployeeResponse.from_orm_map(existing)

    record = await db.employeeprofile.update(where={"id": profile_id}, data=update_data)
    return EmployeeResponse.from_orm_map(record)


@router.delete("/employees/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    profile_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete an employee profile."""
    existing = await db.employeeprofile.find_unique(where={"id": profile_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    await db.employeeprofile.delete(where={"id": profile_id})
