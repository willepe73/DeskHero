# App Overview

ContractingApp is a web application designed for managing freelance consultants, employees, their contracts, and client assignments. 

## Technology Stack

The application uses a modern technology stack separated into a frontend and a backend:

### Backend
*   **Language:** Python 3.11+
*   **Framework:** FastAPI
*   **Database:** SQLite (for local development) / PostgreSQL (for production)
*   **ORM:** Prisma (prisma-client-py)
*   **Authentication:** JWT (HS256) with role-based access control

### Frontend
*   **Framework:** Next.js 14
*   **Library:** React
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS

## Architecture

The application follows a standard client-server architecture. The Next.js frontend communicates with the FastAPI backend via RESTful APIs. The backend uses Prisma ORM to interact with the relational database.

*   **Users & Roles:** The system supports distinct roles (`admin` and `managing_partner`). Admins have global access, while managing partners have access restricted to their assigned consultancy companies.
*   **Entities:** The core entities include Consultancy Companies, Clients, Freelance Profiles, Employee Profiles, Contracts, and Assignments.

## Setup & Deployment

*   **Local Backend:** Managed via standard Python virtual environments, `pip` for dependencies, and `uvicorn` for the server. Prisma CLI is used to push schemas and generate the client.
*   **Local Frontend:** Managed via `npm`.
*   **Production Deployment:** Utilizes PostgreSQL instead of SQLite, applying database schemas via `prisma migrate deploy`.
