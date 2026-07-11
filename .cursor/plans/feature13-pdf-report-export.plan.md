# Feature 13 — PDF report export

Role-scoped PDF downloads for lease contracts, invoices, maintenance requests, and landlord financial summaries.

See Cursor plan: `pdf_report_export_3b515810.plan.md`

## Decisions

- Tenant + landlord only (no admin)
- PDF only (server-side Thymeleaf + OpenHTMLToPDF 1.1.37)
- Endpoints under `/api/v1/reports/...`

## Backend endpoints

| Method | Path |
|--------|------|
| GET | `/api/v1/reports/lease-contracts/{id}.pdf` |
| GET | `/api/v1/reports/invoices/{id}.pdf` |
| GET | `/api/v1/reports/invoices.pdf` |
| GET | `/api/v1/reports/maintenance/{id}.pdf` |
| GET | `/api/v1/reports/maintenance.pdf` |
| GET | `/api/v1/reports/financial-summary.pdf` |

## Implementation status

- [x] Backend PDF infra + templates
- [x] ReportAccessService / ReportService / ReportController
- [x] Frontend apiBlob + report API + DownloadReportButton
- [x] Wire tenant pages
- [x] Wire landlord pages
- [x] Smoke RBAC (unauthenticated → 401; all 6 paths in OpenAPI; tsc clean)

## Landlord UI placement

- Financial reports: financial summary PDF + pending invoices PDF + per-invoice PDF
- Active leases: lease contract PDF per row
- Maintenance queue: filtered list PDF + per-request PDF
- Application detail: lease contract PDF when contract exists

## Smoke checks performed

1. Unauthenticated `GET /api/v1/reports/*.pdf` → **401** for all six routes
2. OpenAPI lists all six report paths
3. Frontend `tsc -b` passes after landlord wiring
4. Role scoping enforced in `ReportAccessService` (tenant/landlord only; financial summary landlord-only)

### Manual UI follow-up (optional)

Log in as tenant and landlord in the app and click Download PDF on each surface to confirm valid PDF files download with scoped data.

