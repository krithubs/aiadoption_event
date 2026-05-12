# CODEMONDAY SUMMIT 2026 - Event Registration

Full-stack Next.js event registration system with user registration, document upload, reference-code lookup, admin review, and PDF name tag download.

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`.

Default development admin credentials are `admin` / `admin12345` if environment variables are not set.

## Features

- User registration with attendee, organization, ticket, dietary, accessibility, notes, password, and multiple supporting documents.
- Reference code issued after submission.
- Returning user lookup with reference code and password.
- Edit registration fields, add documents, or replace documents.
- Admin login from `.env`.
- Admin list/search/detail review.
- Admin status updates and document downloads.
- PDF name tag download per registration.
- Modal dialogs for user-facing errors and success responses.
- Focused tests for validation, security, storage workflow, and PDF output.

## Test

```bash
npm test
```
