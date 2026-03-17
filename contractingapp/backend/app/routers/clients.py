from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate
from app.schemas.common import PaginatedResponse, paginate

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=PaginatedResponse[ClientResponse])
async def list_clients(
    search: str | None = None,
    type: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[ClientResponse]:
    """List clients with optional search/filter and pagination."""
    where: dict = {}
    if type:
        where["type"] = type
    if search:
        where["name"] = {"contains": search}

    skip = (page - 1) * size
    total = await db.client.count(where=where)
    records = await db.client.find_many(
        where=where,
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [ClientResponse.from_orm_map(r) for r in records]
    return PaginatedResponse[ClientResponse](**paginate(items, total, page, size))


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ClientResponse:
    """Create a new client."""
    record = await db.client.create(
        data={
            "name": payload.name,
            "type": payload.type,
            "billingEmail": payload.billing_email,
            "billingAddress": payload.billing_address,
        }
    )
    return ClientResponse.from_orm_map(record)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ClientResponse:
    """Retrieve a single client with their associated assignments."""
    record = await db.client.find_unique(
        where={"id": client_id},
        include={"assignments": True},
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientResponse.from_orm_map(record, include_assignments=True)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ClientResponse:
    """Update a client."""
    existing = await db.client.find_unique(where={"id": client_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    update_data: dict = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.type is not None:
        update_data["type"] = payload.type
    if payload.billing_email is not None:
        update_data["billingEmail"] = payload.billing_email
    if payload.billing_address is not None:
        update_data["billingAddress"] = payload.billing_address

    if not update_data:
        return ClientResponse.from_orm_map(existing)

    record = await db.client.update(where={"id": client_id}, data=update_data)
    return ClientResponse.from_orm_map(record)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete a client."""
    existing = await db.client.find_unique(where={"id": client_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    await db.client.delete(where={"id": client_id})
