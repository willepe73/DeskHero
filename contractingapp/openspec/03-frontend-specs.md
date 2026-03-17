# Frontend Specifications

The Frontend is a Next.js 14 application leveraging the App Router paradigm. It provides a distinct set of views mapping to the backend API data structures.

## Technology Stack & Conventions
- **Pages / Routing:** Next.js App Router (`app/` directory).
- **Styling:** Tailwind CSS mapped to strict configurations.
- **Component Architecture:** Shared components live in `components/ui` (buttons, forms, badges, modals). Broad layout components like Sidebars reside in `components/Layout`.
- **API Fetching:** Defined within `lib/api.ts` utilizing `axios`.

## Routings & Views

### `app/login/`
The unauthenticated entry point of the app where users receive their JWT tokens.

### `app/companies/`
View and manage available consultancy companies.

### `app/consultants/`
A unified view potentially separating or combining Freelance and Employee profiles for easier searching and management.

### `app/clients/`
View and manage the diverse Client list, specifying intercompany details or end clients.

### `app/contracts/`
Contracts listing outlining terms associated with freelancers. Details include PDF document preview or download functionalities natively handled through UI hooks resolving to specific backend PDF routes.

### `app/assignments/`
Broad view outlining which consultant (freelancer/employee) is assigned to which client contract.

## Authorization Mapping
Frontend navigation securely checks auth context locally (likely using patterns defined in `lib/auth.ts`) pushing users to `login` if the JWT is missing or expired. Certain view mutations (buttons) may be disabled or hidden entirely dependent on whether the `role` metric attached to the user dictates `admin` vs `managing_partner` privileges.
