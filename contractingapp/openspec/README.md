# OpenSpec ContractingApp
**Contract Management System for Consultants**

This folder contains the **OpenSpec** documentation for the ContractingApp, designed with a specification-first and API-first philosophy.

## Purpose of this Repository
The files herein describe the structure, constraints, and features of the application before any code is written. By treating these markdown specs as the absolute source of truth, AI coding assistants (and human developers) can reference this structured context to build predictable, reliable software components.

## Specifications Breakdown
- **`00-app-overview.md`:** The high-level product definition, target users, and fundamental features.
- **`01-data-models.md`:** The core entity definitions (Consultants, Clients, Contracts, Invoices) that represent the database schema.
- **`02-api-specs.md`:** The API-first design endpoints defining the structural contracts (payloads and responses) for the backend and frontend to communicate.
- **`03-frontend-specs.md`:** The high-level frontend specification based on the architectural principle of strict separation of concerns, mapping features to user views.

## Usage Workflow for AI Assistants
1. **Context Initialization:** When a new coding agent is spun up, provide it with the full contents of this `openspec/` directory.
2. **Implementation:** Instruct the AI to build out the API based precisely on `02-api-specs.md` using the schema explicitly laid out in `01-data-models.md`.
3. **Change Isolation:** If a new feature is requested (e.g., adding a "Disputes" system for invoices), first define it here via a new Markdown proposal (e.g., `03-feature-disputes.md`) before implementation is attempted. 
