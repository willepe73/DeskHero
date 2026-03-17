import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from prisma import Prisma

from app.db import get_db
from app.dependencies import CurrentUser, get_current_user
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.contract import ContractCreate, ContractResponse, ContractUpdate, PdfUrlResponse

router = APIRouter(prefix="/contracts", tags=["contracts"])

# PDFs are stored in backend/uploads/ relative to the project root.
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _build_company_filter(current_user: CurrentUser) -> dict | None:
    """Return a Prisma where-clause fragment for company filtering, or None for admin."""
    if current_user.is_admin:
        return None
    if not current_user.company_ids:
        return {"id": "NONE"}  # forces empty result
    return {"in": current_user.company_ids}


@router.get("", response_model=PaginatedResponse[ContractResponse])
async def list_contracts(
    search: str | None = None,
    company_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PaginatedResponse[ContractResponse]:
    """
    List contracts with optional search/filter and pagination.

    managing_partner is automatically scoped to their company_ids.
    """
    where: dict = {}

    # RBAC company scope
    if current_user.is_managing_partner:
        if not current_user.company_ids:
            return PaginatedResponse[ContractResponse](**paginate([], 0, page, size))
        where["consultancyCompanyId"] = {"in": current_user.company_ids}
    elif company_id:
        where["consultancyCompanyId"] = company_id

    if status:
        where["status"] = status
    if search:
        where["name"] = {"contains": search}

    skip = (page - 1) * size
    total = await db.contract.count(where=where)
    records = await db.contract.find_many(
        where=where,
        include={"assignments": True},
        skip=skip,
        take=size,
        order={"createdAt": "desc"},
    )
    items = [ContractResponse.from_orm_map(r, include_assignments=True) for r in records]
    return PaginatedResponse[ContractResponse](**paginate(items, total, page, size))


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    payload: ContractCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ContractResponse:
    """Create a new contract."""
    # Verify consultancy company exists and is accessible
    company = await db.consultancycompany.find_unique(where={"id": payload.consultancy_company_id})
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultancy company not found")
    if current_user.is_managing_partner and payload.consultancy_company_id not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this company")

    create_data: dict = {
        "name": payload.name,
        "consultancyCompanyId": payload.consultancy_company_id,
        "freelanceId": payload.freelance_id,
        "purchaseRate": payload.purchase_rate,
        "startDate": payload.start_date,
        "status": payload.status,
    }
    if payload.end_date:
        create_data["endDate"] = payload.end_date
    if payload.remarks:
        create_data["remarks"] = payload.remarks

    record = await db.contract.create(data=create_data)
    return ContractResponse.from_orm_map(record)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ContractResponse:
    """Retrieve a single contract with its assignments."""
    record = await db.contract.find_unique(
        where={"id": contract_id},
        include={"assignments": True},
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and record.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return ContractResponse.from_orm_map(record, include_assignments=True)


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: str,
    payload: ContractUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ContractResponse:
    """Update a contract."""
    existing = await db.contract.find_unique(where={"id": contract_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and existing.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data: dict = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.consultancy_company_id is not None:
        update_data["consultancyCompanyId"] = payload.consultancy_company_id
    if payload.freelance_id is not None:
        update_data["freelanceId"] = payload.freelance_id
    if payload.purchase_rate is not None:
        update_data["purchaseRate"] = payload.purchase_rate
    if payload.start_date is not None:
        update_data["startDate"] = payload.start_date
    if payload.end_date is not None:
        update_data["endDate"] = payload.end_date
    if payload.remarks is not None:
        update_data["remarks"] = payload.remarks
    if payload.status is not None:
        update_data["status"] = payload.status

    if not update_data:
        return ContractResponse.from_orm_map(existing)

    record = await db.contract.update(where={"id": contract_id}, data=update_data)
    return ContractResponse.from_orm_map(record)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> None:
    """Delete a contract."""
    existing = await db.contract.find_unique(where={"id": contract_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and existing.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.contract.delete(where={"id": contract_id})


@router.post("/{contract_id}/pdf", response_model=ContractResponse)
async def upload_pdf(
    contract_id: str,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> ContractResponse:
    """
    Upload a PDF for a contract.

    The file is stored in backend/uploads/ with a UUID-based filename.
    The filename is saved as pdf_blob_storage_id on the contract.
    """
    existing = await db.contract.find_unique(where={"id": contract_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and existing.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Validate content type
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    # Remove old PDF if it exists
    if existing.pdfBlobStorageId:
        old_path = UPLOAD_DIR / existing.pdfBlobStorageId
        if old_path.exists():
            old_path.unlink()

    # Generate a unique filename preserving the .pdf extension
    original_name = file.filename or "contract.pdf"
    ext = Path(original_name).suffix or ".pdf"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    contents = await file.read()
    dest.write_bytes(contents)

    record = await db.contract.update(
        where={"id": contract_id},
        data={"pdfBlobStorageId": filename},
        include={"assignments": True},
    )
    return ContractResponse.from_orm_map(record, include_assignments=True)


@router.get("/{contract_id}/pdf", response_model=PdfUrlResponse)
async def get_pdf_url(
    contract_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> PdfUrlResponse:
    """
    Return the PDF download URL for a contract.

    The URL points to /api/v1/contracts/{id}/pdf/download.
    """
    record = await db.contract.find_unique(where={"id": contract_id})
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and record.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not record.pdfBlobStorageId:
        return PdfUrlResponse(pdf_url=None, filename=None)

    return PdfUrlResponse(
        pdf_url=f"/api/v1/contracts/{contract_id}/pdf/download",
        filename=record.pdfBlobStorageId,
    )


@router.get("/{contract_id}/pdf/download")
async def download_pdf(
    contract_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Prisma = Depends(get_db),
) -> FileResponse:
    """Serve the stored PDF file for a contract."""
    record = await db.contract.find_unique(where={"id": contract_id})
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if current_user.is_managing_partner and record.consultancyCompanyId not in current_user.company_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not record.pdfBlobStorageId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No PDF uploaded for this contract")

    file_path = UPLOAD_DIR / record.pdfBlobStorageId
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=record.pdfBlobStorageId,
    )
