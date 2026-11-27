# Frontend Security Notes

## Scope

Frontend validation and rendering safeguards reduce risk but are not the security boundary. The FastAPI backend must authenticate users, authorize access, validate requests, and enforce rate limits independently.

## Client safeguards

- Validate investigation input before sending it and enforce limits again on the backend.
- Render API and investigation data as text; do not inject untrusted HTML.
- Validate external URLs against the configured allowlist before rendering links.
- Treat API responses as untrusted and map them into bounded frontend models.
- Keep private API credentials on the server. `VITE_*` values are public in the built client.
- The auth store persists its session token in browser storage. Avoid storing other sensitive data there and keep the backend token lifetime and revocation policy appropriately constrained.

## Backend responsibilities

The API is responsible for session validation, authorization, account and investigation isolation, request validation, abuse controls, and secure transport. Client-side checks must never replace these controls.