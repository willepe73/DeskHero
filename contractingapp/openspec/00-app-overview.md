# General Application Overview

## Name
ContractingApp - Contract & Consultant Management System

## Purpose
A specialized web application for managing freelance consultants and employees, their assignments with clients. The goal is to provide a single source of truth for all freelance consultants and employee engagements, streamlining administrative overhead.

## Target Audience
- **Global Admins:** Can view and manage all data across all companies.
- **Managing Partners:** Operations personnel managing multiple freelance consultants and employees specifically for their assigned consultancy companies.

## Core Features
1. **Freelance Profiles:** 
- A agency admin can create, update and remove freelance profiles, assignments and contracts.
- A freelance can have multiple contracts within a consultancy company.
2. **Employee Profiles:** 
- A agency admin can create, update and remove employee profiles, assignments and contracts.
- An employee can only have one contract within a consultancy company.
3. **Client Management:** 
- A agency admin can create, update and remove client companies. 
- An client can be an intercompany companies or an end client.
4. **Consultancy Company Profile:** 
- A consultancy company which can have contracts of freelance profiles and their employee profiles.
5. **Contract Management:**
   - Create, update, and terminate contracts between freelance consultants, employees and their consultancy company.
   - Upload, update and view PDF contracts of the freelance consultant.
   - Define assignments for freelance consultants and clients.
   - Define assignments for employees and clients.
   - Track start/end dates.
6. **Assignment Management:**
- Create, update and remove assignments for a freelancer or employee.
- An assignment has: a timesheet code, an client tariff, start and end date, tariff type (%,50/50,end tariff)
- An assignment can be retrieved by the timesheet code.

## Architectural Principles
- **Technology Stack API and database:** Python, FastAPI, Prisma, PostgreSQL 
- **Technology Stack Frontend:** React, Next.js 
- **API-First Design:** All functionality must be exposed via a RESTful JSON API before any frontend UI is built. The frontend will be a consumer of this API. The API is structured into a separated folder. A open AI spec is provided for the API.
- **Frontend website:** A frontend website will be built to consume the API and provide a user interface for managing consultants and contracts. Separation of concerns between frontend and backend is mandatory. The frontend is structured into a separated folder.
- **Stateless Authentication:** JWT-based authentication including role based access control for securing API endpoints.
- **Database:** Relational PostgreSQL database for transactional integrity, when testing locally, an in memory db is used which is prefilled with anonymous data.
- **Quickstart:** Provide a quickstart guide for installing and running the application locally. This should include all steps necessary to get the application up and running, including database setup and any other dependencies.
