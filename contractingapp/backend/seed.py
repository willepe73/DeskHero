"""
Seed script for the Contracting App database.

Run from the backend/ directory:
    python seed.py

Creates:
  - 2 consultancy companies
  - 3 clients
  - 4 freelance profiles
  - 2 employee profiles
  - 3 contracts  (freelancers only; purchase rate stored on contract)
  - 6 assignments (4 contract-linked, 2 employee-linked)
  - 1 admin user    (admin@example.com  / admin123)
  - 1 managing_partner user (partner@example.com / partner123, scoped to company 1)
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone

import bcrypt
from prisma import Prisma

# ---------------------------------------------------------------------------
# Make sure .env is loaded when running the script directly
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass


def _dt(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, tzinfo=timezone.utc)


async def seed() -> None:
    db = Prisma()
    await db.connect()

    print("Connected to database.")

    # ------------------------------------------------------------------
    # Clean up existing data (order matters for FK constraints)
    # ------------------------------------------------------------------
    await db.assignment.delete_many()
    await db.contract.delete_many()
    await db.freelanceprofile.delete_many()
    await db.employeeprofile.delete_many()
    await db.client.delete_many()
    await db.consultancycompany.delete_many()
    await db.user.delete_many()
    print("Existing data cleared.")

    # ------------------------------------------------------------------
    # Consultancy Companies
    # ------------------------------------------------------------------
    company1 = await db.consultancycompany.create(data={"name": "Apex Consulting BV"})
    company2 = await db.consultancycompany.create(data={"name": "Vertex Solutions NV"})
    print(f"Created companies: {company1.id}, {company2.id}")

    # ------------------------------------------------------------------
    # Clients
    # ------------------------------------------------------------------
    client_interco = await db.client.create(
        data={
            "name": "Apex Internal Services",
            "type": "intercompany",
            "billingAddress": "Rue de la Loi 12, 1000 Brussels",
        }
    )
    client_end1 = await db.client.create(
        data={
            "name": "Fortis Bank",
            "type": "end_client",
            "billingAddress": "Avenue des Arts 35, 1040 Brussels",
        }
    )
    client_end2 = await db.client.create(
        data={
            "name": "BelTech Industries",
            "type": "end_client",
            "billingAddress": "Technologielaan 5, 3001 Leuven",
        }
    )
    print(f"Created clients: {client_interco.id}, {client_end1.id}, {client_end2.id}")

    # ------------------------------------------------------------------
    # Freelance Profiles
    # ------------------------------------------------------------------
    fl1 = await db.freelanceprofile.create(
        data={
            "firstName": "Sophie",
            "lastName": "Martens",
            "fixed": False,
            "status": "active",
            "companyId": company1.id,
        }
    )
    fl2 = await db.freelanceprofile.create(
        data={
            "firstName": "Thomas",
            "lastName": "Dubois",
            "fixed": True,
            "status": "active",
            "companyId": company1.id,
        }
    )
    fl3 = await db.freelanceprofile.create(
        data={
            "firstName": "Lena",
            "lastName": "Jacobs",
            "fixed": False,
            "status": "active",
            "companyId": company2.id,
        }
    )
    fl4 = await db.freelanceprofile.create(
        data={
            "firstName": "Pieter",
            "lastName": "Van Den Berg",
            "fixed": False,
            "status": "inactive",
            "companyId": company2.id,
        }
    )
    print(f"Created freelancers: {fl1.id}, {fl2.id}, {fl3.id}, {fl4.id}")

    # ------------------------------------------------------------------
    # Employee Profiles
    # ------------------------------------------------------------------
    emp1 = await db.employeeprofile.create(
        data={
            "firstName": "Marc",
            "lastName": "Lecomte",
            "cronosCostPrice220d": 48000.00,
            "cronosCostPrice180d": 42000.00,
            "status": "active",
            "companyId": company1.id,
        }
    )
    emp2 = await db.employeeprofile.create(
        data={
            "firstName": "Ines",
            "lastName": "Goossens",
            "cronosCostPrice220d": 52000.00,
            "cronosCostPrice180d": 46000.00,
            "status": "active",
            "companyId": company2.id,
        }
    )
    print(f"Created employees: {emp1.id}, {emp2.id}")

    # ------------------------------------------------------------------
    # Contracts
    # ------------------------------------------------------------------
    contract1 = await db.contract.create(
        data={
            "name": "Sophie Martens @ Fortis Bank 2024",
            "consultancyCompanyId": company1.id,
            "freelanceId": fl1.id,
            "purchaseRate": 650.00,
            "startDate": _dt(2024, 1, 15),
            "endDate": _dt(2024, 12, 31),
            "remarks": "Rate negotiated annually.",
            "status": "active",
        }
    )
    contract2 = await db.contract.create(
        data={
            "name": "Thomas Dubois @ BelTech 2024",
            "consultancyCompanyId": company1.id,
            "freelanceId": fl2.id,
            "purchaseRate": 700.00,
            "startDate": _dt(2024, 3, 1),
            "endDate": _dt(2024, 12, 31),
            "status": "active",
        }
    )
    contract3 = await db.contract.create(
        data={
            "name": "Lena Jacobs @ Fortis Bank 2024",
            "consultancyCompanyId": company1.id,
            "freelanceId": fl3.id,
            "purchaseRate": 600.00,
            "startDate": _dt(2024, 4, 1),
            "endDate": _dt(2024, 12, 31),
            "status": "active",
        }
    )
    print(f"Created contracts: {contract1.id}, {contract2.id}, {contract3.id}")

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------
    # Contract-linked assignments
    assign1 = await db.assignment.create(
        data={
            "contractId": contract1.id,
            "clientId": client_interco.id,
            "endClientId": client_end1.id,
            "timesheetCode": "APEX-FB-2024-001",
            "startDate": _dt(2024, 1, 15),
            "endDate": _dt(2024, 12, 31),
            "clientTariff": 800.00,
            "endTariff": 850.00,
            "tariffType": "end_tariff",
            "remarks": "Daily rate, remote-first.",
            "status": "active",
        }
    )
    assign2 = await db.assignment.create(
        data={
            "contractId": contract2.id,
            "clientId": client_interco.id,
            "endClientId": client_end2.id,
            "timesheetCode": "APEX-BT-2024-001",
            "startDate": _dt(2024, 3, 1),
            "endDate": _dt(2024, 12, 31),
            "clientTariff": 850.00,
            "tariffType": "percentage",
            "remarks": "10% management fee applies.",
            "status": "active",
        }
    )
    assign3 = await db.assignment.create(
        data={
            "contractId": contract3.id,
            "clientId": client_interco.id,
            "endClientId": client_end1.id,
            "timesheetCode": "APEX-FB-2024-002",
            "startDate": _dt(2024, 4, 1),
            "endDate": _dt(2024, 12, 31),
            "clientTariff": 720.00,
            "tariffType": "50_50",
            "status": "active",
        }
    )
    assign4 = await db.assignment.create(
        data={
            "contractId": contract1.id,
            "clientId": client_interco.id,
            "endClientId": client_end2.id,
            "timesheetCode": "APEX-BT-2024-SOP",
            "startDate": _dt(2024, 7, 1),
            "endDate": _dt(2024, 9, 30),
            "clientTariff": 820.00,
            "endTariff": 870.00,
            "tariffType": "end_tariff",
            "remarks": "Short-term side assignment.",
            "status": "completed",
        }
    )
    # Employee-linked assignments (no contract)
    assign5 = await db.assignment.create(
        data={
            "employeeId": emp1.id,
            "clientId": client_interco.id,
            "endClientId": client_end1.id,
            "timesheetCode": "VERT-FB-2023-001",
            "startDate": _dt(2023, 6, 1),
            "endDate": _dt(2023, 12, 31),
            "clientTariff": 700.00,
            "tariffType": "50_50",
            "status": "completed",
        }
    )
    assign6 = await db.assignment.create(
        data={
            "employeeId": emp2.id,
            "clientId": client_interco.id,
            "endClientId": client_end2.id,
            "timesheetCode": "VERT-BT-2024-001",
            "startDate": _dt(2024, 2, 1),
            "endDate": _dt(2024, 12, 31),
            "clientTariff": 780.00,
            "tariffType": "percentage",
            "status": "active",
        }
    )
    print(
        f"Created assignments: {assign1.id}, {assign2.id}, {assign3.id}, "
        f"{assign4.id}, {assign5.id}, {assign6.id}"
    )

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    admin_user = await db.user.create(
        data={
            "email": "admin@example.com",
            "hashedPassword": bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode(),
            "role": "admin",
            "companyIds": json.dumps([]),
        }
    )
    partner_user = await db.user.create(
        data={
            "email": "partner@example.com",
            "hashedPassword": bcrypt.hashpw(b"partner123", bcrypt.gensalt()).decode(),
            "role": "managing_partner",
            "companyIds": json.dumps([company1.id]),
        }
    )
    print(f"Created users: {admin_user.email} (admin), {partner_user.email} (managing_partner)")
    print(f"  managing_partner scoped to company: {company1.id} ({company1.name})")

    await db.disconnect()
    print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
