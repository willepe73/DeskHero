# API Specifications

The Backend API is built using Python FastAPI and uses standard RESTful architectures, returning JSON.
All endpoints require a valid JWT token via the `Authorization: Bearer <token>` header, except for `/auth/login`.

## Authentication

### `POST /api/v1/auth/login`
Validates user credentials and returns a JWT token.
- **Request Body:** Email and password credentials.
- **Response:** Bearer token with expiration.

## Entities APIs

Common CRUD endpoints are provided for system entities. Typical patterns include:
- `GET /api/v1/:resource` - List all entries (respects role limitations)
- `POST /api/v1/:resource` - Create a new entry
- `GET /api/v1/:resource/:id` - Retrieve specific entry details
- `PUT /api/v1/:resource/:id` - Update specific entry details
- `DELETE /api/v1/:resource/:id` - Remove specific entry

### Companies
Base Path: `/api/v1/companies`

### Clients
Base Path: `/api/v1/clients`

### Freelancers
Base Path: `/api/v1/profiles/freelance`

### Employees
Base Path: `/api/v1/profiles/employee`

### Contracts
Base Path: `/api/v1/contracts`
Additionally includes specific sub-resources for managing PDF documents:
- `POST /api/v1/contracts/:id/pdf` - Upload a PDF contract.
- `GET /api/v1/contracts/:id/pdf` - Retrieve a previously uploaded PDF contract.

### Assignments
Base Path: `/api/v1/assignments`

## Roles & Access
1.  **Admin:** Can access and mutate data globally across all entities.
2.  **Managing Partner:** Restricted to accessing entities that are related to their assigned `companyIds`. All endpoints implicitly enforce filtering based on these IDs matching the target object's `companyId`.
