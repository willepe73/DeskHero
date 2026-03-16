# Database Data Models

## User Roles
* `admin` - Global administrator with access to view and manage all data across all companies.
* `managing_partner` - Operations personnel managing freelancers and employees for their specific consultancy company. Can only see and maintain data for their assigned company.

## Entities

### `ConsultancyCompany`
A business unit employing employees or contracting freelancers.
* `id` (UUID, Primary Key)
* `name` (String, Required)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `Client`
An intercompany company or an end client that hires freelancers/employees through a consultancy company.
* `id` (UUID, Primary Key)
* `name` (String, Required)
* `type` (Enum: `intercompany`, `end_client`, Required)
* `billing_email` (String, Required)
* `billing_address` (Text, Optional)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `FreelanceProfile`
Represents an independent contractor.
* `id` (UUID, Primary Key)
* `first_name` (String, Required)
* `last_name` (String, Required)
* `purchase_rate` (Decimal, Required)
* `fixed` (Boolean, Default: false) - Indicates if the freelance consultant has a fixed engagement or rate
* `status` (Enum: `active`, `inactive`, Default: `active`)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `EmployeeProfile`
Represents an internal employee.
* `id` (UUID, Primary Key)
* `first_name` (String, Required)
* `last_name` (String, Required)
* `cronos_cost_price_220d` (Decimal, Required)
* `cronos_cost_price_180d` (Decimal, Required)
* `status` (Enum: `active`, `inactive`, Default: `active`)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `Contract`
Binding agreement between a freelance profile or employee profile and their Consultancy Company.
* `id` (UUID, Primary Key)
* `consultancy_company_id` (FK to `ConsultancyCompany`, Required)
* `profile_type` (Enum: `freelance`, `employee`, Required)
* `freelance_id` (FK to `FreelanceProfile`, Optional - required if profile_type is freelance)
* `employee_id` (FK to `EmployeeProfile`, Optional - required if profile_type is employee)
* `start_date` (Date, Required)
* `end_date` (Date, Optional)
* `pdf_blob_storage_id` (String, Optional) - Reference to document in blob storage (primarily for freelancers)
* `max_budget` (Decimal, Optional)
* `remarks` (Text, Optional)
* `status` (Enum: `active`, `terminated`, Default: `active`)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)

### `Assignment`
A specific placement of a freelancer or employee at a client.
* `id` (UUID, Primary Key)
* `contract_id` (FK to `Contract`, Required)
* `client_id` (FK to `Client`, Required) - The primary intercompany or direct client
* `end_client_id` (FK to `Client`, Required) - The ultimate end client if the assignment is through an intermediary
* `timesheet_code` (String, Required)
* `start_date` (Date, Required)
* `end_date` (Date, Optional)
* `client_tariff` (Decimal, Required)
* `end_tariff` (Decimal, Optional)
* `tariff_type` (Enum: `percentage`, `50_50`, `end_tariff`, Required)
* `remarks` (Text, Optional)
* `status` (Enum: `active`, `completed`, `cancelled`, Default: `active`)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)
