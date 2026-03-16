# Frontend Specifications

## Overview
The frontend serves as the primary user interface for Agency Admins to manage freelance consultants, employees, their contracts, and assignments. 
Following the architectural principles, the frontend is strictly separated from the backend and consumes the RESTful JSON API defined in `02-api-specs.md`.

## Technology Strategy
*   **Framework:** Next.js. Must support a single-page application (SPA) or hybrid SSR approach.
*   **Routing:** Client-side routing for seamless navigation between entities.
*   **State Management:** Appropriate client-side state management for handling lists, forms, and API caching.
*   **Authentication & Authorization:** JWT token management via `localStorage` or `sessionStorage`, attaching `Bearer` tokens to all outgoing API requests. Role-based access (which Consultancy Companies an admin can view) is dictated strictly by the claims present in the decoded JWT.

## Core Pages / Views

### 1. Dashboard
*   **Purpose:** High-level overview of active contracts and assignments for a selected consultancy company.
*   **Role Access:** Users (`managing_partner`) only see data for Consultancy Companies given in their JWT. Global `admin` users see an overview of all companies.
*   **Key Elements:**
    *   Metrics: Count of active freelancers, employees, and upcoming contract expirations.
    *   List of recently created or terminated contracts.

### 2. Consultancy Companies Management
*   **Purpose:** Manage the overarching consultancy entities.
*   **Role Access:** `managing_partner` sees only their assigned companies. Global `admin` can see and manage all companies.
*   **Key Elements:**
    *   List view with search and pagination.
    *   Form to create or update a company.
    *   Detail view showing associated contracts.

### 3. Consultants Hub (Freelancers & Employees)
*   **Purpose:** Unified hub to manage the workforce.
*   **Role Access:** For `managing_partner` visibility of profiles is restricted to only those holding active or historical contracts with their authorized Consultancy Companies. Global `admin` can see all profiles.
*   **Key Elements:**
    *   Tabbed view separating **Freelancers** and **Employees**.
    *   **Freelance Detail/Edit:**
        *   Fields: First Name, Last Name, Purchase Rate, Fixed (Boolean).
        *   Sub-section: List of their active Contracts and Assignments across all consultancy companies.
    *   **Employee Detail/Edit:**
        *   Fields: First Name, Last Name, Cronos Cost Price (220d & 180d).
        *   Sub-section: List of their active Assignments.

### 4. Client Directory
*   **Purpose:** Manage both End Clients and Intercompany Clients.
*   **Role Access:** For `managing_partner` visibility of clients is restricted to only those associated with assignments for their authorized Consultancy Companies. Global `admin` can see all clients.
*   **Key Elements:**
    *   List view with type filtering (`intercompany`, `end_client`).
    *   Form to create/edit clients.
    *   Detail view showing active assignments associated with this client.

### 5. Contract Center
*   **Purpose:** Centralized management of bindings between profiles and consultancy companies.
*   **Role Access:** `managing_partner` sees only contracts belonging to their assigned companies. Global `admin` can see and manage all contracts.
*   **Key Elements:**
    *   Complex list view with multi-filtering (by Company, by Profile Type, by Status).
    *   **Contract Creation Wizard:**
        *   Step 1: Select Consultancy Company.
        *   Step 2: Select Profile Type (Freelance vs. Employee).
        *   Step 3: Pick specific profile.
        *   Step 4: Define Dates and Budget.
    *   **Document Management (Freelancers Only):**
        *   UI component to upload a signed PDF.
        *   Button to view/download the uploaded PDF (interacting with blob storage endpoints).

### 6. Assignment Board
*   **Purpose:** Manage the placement of profiles at specific clients.
*   **Role Access:** `managing_partner` sees only assignments related to contracts from their assigned companies. Global `admin` can see and manage all assignments.
*   **Key Elements:**
    *   Searchable list by Timesheet Code or Profile.
    *   **Assignment Edit Modal/Page:**
        *   Lookup fields for Contract and Client.
        *   Selection for ultimate End Client (Optional).
        *   Inputs for Timesheet Code, Client Tariff, End Tariff, and Dates.
        *   Tariff Type selector (Percentage, 50/50, End Tariff).
        *   Rich Text Area for Remarks.

## UI/UX Guidelines
*   **Forms:** All forms must have client-side validation reflecting the backend constraints defined in `01-data-models.md` (Required fields, correct data types).
*   **API Errors:** Implement global error handling to display toast notifications or inline errors if an API request fails.
*   **Loading States:** Use skeleton loaders or spinners when fetching data arrays from the API.
