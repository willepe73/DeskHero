# ContractingApp — Contract & Consultant Management System

A web application for managing freelance consultants and employees, their contracts, and client assignments.

## Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.11+, FastAPI, Prisma (prisma-client-py) |
| Database | SQLite (local dev) / PostgreSQL (production) |
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Auth | JWT (HS256) with role-based access control |

---

## Quickstart

### Prerequisites

- Python 3.11+
- Node.js 18+
- `pip` and `npm`

---

### 1. Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Generate Prisma client and push schema to SQLite
prisma generate
prisma db push

# Seed the database with anonymous test data
python seed.py

# Start the API server
uvicorn app.main:app --reload
```

API is available at **http://localhost:8000**
Swagger UI: **http://localhost:8000/docs**

---

### 2. Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

Frontend is available at **http://localhost:3000**

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Managing Partner | partner@example.com | partner123 |

**Admin** can view and manage all data across all companies.
**Managing Partner** can only view data for their assigned consultancy company.

---

## Project Structure

```
contractingapp/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT creation & login endpoint
│   │   ├── routers/        # Route handlers (companies, clients, profiles, contracts, assignments)
│   │   ├── schemas/        # Pydantic v2 request/response models
│   │   ├── config.py       # App settings via pydantic-settings
│   │   ├── db.py           # Prisma client + dependency
│   │   ├── dependencies.py # Auth dependencies (get_current_user, require_admin)
│   │   └── main.py         # FastAPI app entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── uploads/            # Uploaded PDF contracts
│   ├── seed.py             # Database seeder
│   ├── .env                # Local environment variables
│   └── requirements.txt
└── frontend/
    ├── app/                # Next.js App Router pages
    │   ├── login/
    │   ├── companies/
    │   ├── consultants/
    │   ├── clients/
    │   ├── contracts/
    │   └── assignments/
    ├── components/
    │   ├── ui/             # Reusable UI components (Button, Modal, Badge, etc.)
    │   └── Layout/         # Sidebar and Header
    ├── lib/
    │   ├── api.ts          # Typed API client (axios)
    │   ├── auth.ts         # JWT storage & decoding helpers
    │   ├── types.ts        # TypeScript interfaces
    │   └── utils.ts        # Utility functions
    └── package.json
```

---

## API Overview

All endpoints (except `/api/v1/auth/login`) require a `Authorization: Bearer <token>` header.

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/v1/auth/login` |
| Companies | `GET/POST /api/v1/companies`, `GET/PUT/DELETE /api/v1/companies/:id` |
| Clients | `GET/POST /api/v1/clients`, `GET/PUT/DELETE /api/v1/clients/:id` |
| Freelancers | `GET/POST /api/v1/profiles/freelance`, `GET/PUT/DELETE /api/v1/profiles/freelance/:id` |
| Employees | `GET/POST /api/v1/profiles/employee`, `GET/PUT/DELETE /api/v1/profiles/employee/:id` |
| Contracts | `GET/POST /api/v1/contracts`, `GET/PUT/DELETE /api/v1/contracts/:id` |
| Contract PDF | `POST /api/v1/contracts/:id/pdf`, `GET /api/v1/contracts/:id/pdf` |
| Assignments | `GET/POST /api/v1/assignments`, `GET/PUT/DELETE /api/v1/assignments/:id` |

---

## Production (PostgreSQL)

Update `.env` in the backend:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/contractingapp"
SECRET_KEY="a-strong-random-secret-key"
```

Then run:

```bash
prisma migrate deploy
```
