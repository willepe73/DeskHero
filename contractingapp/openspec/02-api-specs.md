# API Specifications (API-First Design)

All endpoints utilize RESTful conventions, returning JSON payloads. Assume standard JWT Bearer authentication headers are required for all endpoints under the `/api/v1` path, aside from public endpoints.

## Base URL
`/api/v1`

---

## 1. Profiles (`/profiles`)
*Note: For `managing_partner` roles, all GET requests are implicitly filtered to only return profiles (and sub-resources) associated with `ConsultancyCompany` records they are authorized to access via the `company_ids` claims within their JWT. Global `admin` users can see all profiles.*

### `GET /profiles/freelance`
List all freelance profiles along with their associated `contracts`.

### `POST /profiles/freelance`
Create a new freelance profile.
* **Payload:** `first_name`, `last_name`, `purchase_rate`, `fixed`

### `GET /profiles/employee`
List all employee profiles along with their associated `contracts`.

### `POST /profiles/employee`
Create a new employee profile.

---

## 2. Contracts (`/contracts`)
*Note: `managing_partner` users will only see contracts belonging to a `consultancy_company_id` they manage, indicated by the claims within their JWT. Global `admin` users can see all contracts.*

### `GET /contracts`
List contracts with filtering capabilities (by consultancy company, profile, or status), returned along with their associated `assignments`.

### `POST /contracts`
Create a new contract binding a profile (freelance or employee) to a consultancy company.
* **Payload Structure:**
  ```json
  {
    "name": "Senior React Developer - Q3",
    "consultancy_company_id": "uuid",
    "profile_type": "freelance",
    "freelance_id": "uuid",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30"
  }
  ```

### `POST /contracts/:id/pdf`
Upload the signed PDF contract to blob storage and associate it with the contract record.
* **Payload:** `multipart/form-data` with `file` field.
* **Response:** Returns the updated contract containing the new `pdf_blob_storage_id`.

### `GET /contracts/:id/pdf`
Download or get a pre-signed GET URL for the contract PDF from blob storage.

---

## 3. Assignments (`/assignments`)

### `POST /assignments`
Create an assignment placing a contracted profile at a client.
* **Payload Structure:**
  ```json
  {
    "contract_id": "uuid",
    "client_id": "uuid",
    "end_client_id": "uuid",
    "timesheet_code": "DEV-101",
    "start_date": "2024-02-01",
    "client_tariff": 85.00,
    "tariff_type": "percentage",
    "end_tariff": 100.00,
    "remarks": "Assigned to the Core Platform team"
  }
  ```
