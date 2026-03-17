from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user, require_admin
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=PaginatedResponse[CompanyResponse])
async def list_companies(
    search: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[CompanyResponse]:
    """
    List consultancy companies with optional search and pagination.

    - admin: returns all companies.
    - managing_partner: returns only the companies included in their JWT company_ids claim.
    """
    where: dict = {}
    if not current_user.is_admin:
        if not current_user.company_ids:
            return PaginatedResponse[CompanyResponse](**paginate([], 0, page, size))
        where["id"] = {"in": current_user.company_ids}
    if search:
        where["name"] = {"contains": search}

    skip = (page - 1) * size
    total = await db.consultancycompany.count(where=where)
    records = await db.consultancycompany.find_many(
        where=where,
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [CompanyResponse.from_orm_map(r) for r in records]
    return PaginatedResponse[CompanyResponse](**paginate(items, total, page, size))


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    _: CurrentUser = Depends(require_admin),
    db: Prisma = Depends(get_db),
) -> CompanyResponse:
    """Create a new consultancy company (admin only)."""
    record = await db.consultancycompany.create(data={"name": payload.name})
    return CompanyResponse.from_orm_map(record)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> CompanyResponse:
    """Retrieve a single consultancy company by ID."""
    record = await db.consultancycompany.find_unique(where={"id": company_id})
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    # managing_partner may only see their own companies
    if current_user.is_managing_partner and company_id not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return CompanyResponse.from_orm_map(record)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    payload: CompanyUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> CompanyResponse:
    """Update a consultancy company."""
    existing = await db.consultancycompany.find_unique(where={"id": company_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    if current_user.is_managing_partner and company_id not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data: dict = {}
    if payload.name is not None:
        update_data["name"] = payload.name

    if not update_data:
        return CompanyResponse.from_orm_map(existing)

    record = await db.consultancycompany.update(where={"id": company_id}, data=update_data)
    return CompanyResponse.from_orm_map(record)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str,
    _: CurrentUser = Depends(require_admin),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete a consultancy company (admin only)."""
    existing = await db.consultancycompany.find_unique(where={"id": company_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    await db.consultancycompany.delete(where={"id": company_id})
