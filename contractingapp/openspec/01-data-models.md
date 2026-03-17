# Data Models

The following data models describe the core entities and their relationships within the ContractingApp system. The database is managed via Prisma ORM.

---

## ConsultancyCompany
Represents a consultancy company that employs or contracts workers.
*   `id` (String, KSUID/CUID) - Primary Key
*   `name` (String) - Name of the company
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## Client
Represents a client who assigns work.
*   `id` (String, KSUID/CUID) - Primary Key
*   `name` (String) - Name of the client
*   `type` (String) - Enum values: `intercompany` or `end_client`
*   `billingAddress` (String, Optional) - Address for billing
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## FreelanceProfile
Profiles of freelance workers associated with a consultancy company.
*   `id` (String, KSUID/CUID) - Primary Key
*   `companyId` (String) - Foreign Key to `ConsultancyCompany`
*   `firstName` (String) - First name
*   `lastName` (String) - Last name
*   `fixed` (Boolean) - Default `false`
*   `status` (String) - Enum values: `active` or `inactive` (Default: `active`)
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## EmployeeProfile
Profiles of internal employees associated with a consultancy company.
*   `id` (String, KSUID/CUID) - Primary Key
*   `companyId` (String) - Foreign Key to `ConsultancyCompany`
*   `firstName` (String) - First name
*   `lastName` (String) - Last name
*   `cronosCostPrice220d` (Float) - Cost price metric
*   `cronosCostPrice180d` (Float) - Cost price metric
*   `status` (String) - Enum values: `active` or `inactive` (Default: `active`)
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## Contract
Agreements covering freelance workers.
*   `id` (String, KSUID/CUID) - Primary Key
*   `name` (String) - Name of the agreement
*   `consultancyCompanyId` (String) - Foreign Key to `ConsultancyCompany`
*   `freelanceId` (String) - Foreign Key to `FreelanceProfile`
*   `purchaseRate` (Float) - Agreed purchase rate
*   `startDate` (DateTime) - Contracting start date
*   `endDate` (DateTime) - Contracting end date
*   `pdfBlobStorageId` (String, Optional) - Reference ID for stored PDF contract
*   `remarks` (String, Optional) - Additional observations
*   `status` (String) - Enum values: `active` or `terminated` (Default: `active`)
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## Assignment
Specific project or task assignments mapped to workers and clients.
*   `id` (String, KSUID/CUID) - Primary Key
*   `contractId` (String, Optional) - Foreign Key to `Contract`
*   `employeeId` (String, Optional) - Foreign Key to `EmployeeProfile`
*   `clientId` (String) - Foreign Key to `Client` (Intermediary/Direct)
*   `endClientId` (String) - Foreign Key to `Client` (Ultimate end client)
*   `timesheetCode` (String) - Code for timesheet tracking
*   `startDate` (DateTime) - Assignment start date
*   `endDate` (DateTime) - Assignment end date
*   `clientTariff` (Float) - Tariff applied to client
*   `endTariff` (Float, Optional) - Tariff applied to end client
*   `tariffType` (String) - Enum values: `percentage`, `50_50`, or `end_tariff`
*   `remarks` (String, Optional) - Additional observations
*   `status` (String) - Enum values: `active`, `completed`, or `cancelled` (Default: `active`)
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp

## User
System users who authenticate and manage data.
*   `id` (String, KSUID/CUID) - Primary Key
*   `email` (String) - Unique email address
*   `hashedPassword` (String) - Secure password hash
*   `role` (String) - Enum values: `admin` or `managing_partner`
*   `companyIds` (String) - JSON array of UUIDs limiting `managing_partner` access points
*   `createdAt` (DateTime) - Auto-generated creation timestamp
*   `updatedAt` (DateTime) - Auto-generated update timestamp
