# Module 13 — PDF Report Export — Manual Test Plan

Frontend/user-flow testing for downloading PDF reports (lease contracts, invoices, maintenance, landlord financial summary).  
Backend API base: `/api/v1/reports` (via frontend `VITE_API_BASE_URL`, often `http://localhost:8080` locally).

---

## Before you start

### Services to run

1. **Backend:** `property-management` Spring Boot app running and connected to PostgreSQL.
2. **Frontend:** `property-management-webapp` dev server (`npm run dev`, usually `http://localhost:5173`).

### Test accounts required

You need **two active accounts**:

| Role | Backend role | UI home | Used for |
|------|--------------|---------|----------|
| **Tenant** | `TENANT` | `/tenant` | Own lease / invoice / maintenance PDFs |
| **Landlord / Owner** | `LAND_LORD` | `/landlord` or `/owner` | Owned-property PDFs + financial summary |

> **Cannot verify from codebase alone:** Exact login emails/passwords and whether your DB already has accepted leases, invoices, and maintenance rows. Use real accounts from your environment.

### Important preconditions

1. Tenant has at least one **ACCEPTED** lease contract on a property owned by the landlord.
2. At least one **invoice** exists for that lease (pending or paid).
3. At least one **maintenance request** exists for that tenant/unit (optional for lease/invoice tests; required for maintenance PDF tests).

### Suggested data setup (if starting fresh)

1. Log in as **landlord** → ensure a property with a unit exists.
2. Log in as **tenant** → apply/book that unit.
3. As **landlord** → approve, create/send contract.
4. As **tenant** → accept the contract (`ACCEPTED`).
5. Generate or request an invoice; create a maintenance request.
6. Then run the tests below.

### What “success” looks like for a PDF download

- Button shows a short loading state (“Downloading…”).
- A success toast appears (e.g. “Lease contract PDF downloaded.”).
- Browser downloads a `.pdf` file with a sensible name (e.g. `lease-contract-12.pdf`, `invoice-5.pdf`).
- Opening the file in a PDF viewer shows readable content (parties, amounts, dates, etc.), not a blank/corrupt file.

---

## Test 1 — Tenant downloads lease contract PDF (lease desk)

**Login as:** Tenant

### Steps

1. Log in with the tenant account.
2. In the left sidebar, click **Lease** (or go to `/tenant/lease`).
3. If an **Active tenancy** panel is shown, click **Download lease PDF**.
4. Open the downloaded PDF.

### Expected at each step

| Step | Expected |
|------|----------|
| Lease desk | Active tenancy panel visible for the accepted lease. |
| Click Download lease PDF | Loading on button; success toast; PDF file downloads. |
| Open PDF | Shows contract id/status, tenant, property/unit, dates, line items, terms. |

### Final expected result

Tenant has a valid lease contract PDF for **their** accepted lease only.

---

## Test 2 — Tenant downloads lease PDF from application detail

**Login as:** Tenant

### Steps

1. Go to **Lease** (`/tenant/lease`).
2. Open an application that has a linked contract (click into application detail, `/tenant/lease/:applicationId`).
3. Scroll to **Contract terms**.
4. Click **Download lease PDF**.
5. Open the PDF.

### Expected

| Step | Expected |
|------|----------|
| Contract terms section | Download button visible when a contract exists. |
| Download | Success toast + PDF file. |
| PDF content | Matches the contract shown on the page. |

### Final expected result

Lease PDF is available from the application/contract detail screen as well as the lease desk.

---

## Test 3 — Tenant downloads a single invoice PDF (Payment Hub)

**Login as:** Tenant

### Steps

1. In the sidebar, click **Payments** (or go to `/tenant/payments`).
2. In **Outstanding invoices**, select/click a pending invoice row so the detail panel shows.
3. In the row actions or detail panel, click **Download invoice**.
4. Open the PDF.

### Expected

| Step | Expected |
|------|----------|
| Payment Hub | Pending invoices list loads. |
| Download invoice | Success toast; file like `invoice-{id}.pdf`. |
| PDF | Shows invoice id, status, due date, amount (TZS), tenant/property, line item. |

### Final expected result

Tenant can download an individual invoice PDF from Payment Hub.

---

## Test 4 — Tenant exports invoice list PDF

**Login as:** Tenant

### Steps

1. Stay on **Payments** (`/tenant/payments`).
2. At the top of the page (near **Request invoice**), click **Export invoices PDF**.
3. Open the downloaded statement PDF.

### Expected

| Step | Expected |
|------|----------|
| Export | Success toast (e.g. “Invoice statement PDF downloaded.”). |
| PDF | Table of the tenant’s pending invoices (or empty-state message if none). |
| Scope | Only this tenant’s invoices — no other tenants’ rows. |

### Final expected result

Tenant gets a scoped invoice statement PDF.

---

## Test 5 — Tenant downloads invoice PDF from lease billing section

**Login as:** Tenant

### Steps

1. Open an application detail that has an **ACCEPTED** contract (`/tenant/lease/:applicationId`).
2. Find **Billing & invoices**.
3. Select an invoice and click **Download invoice**.
4. Open the PDF.

### Expected

Same as Test 3: valid single-invoice PDF for the tenant’s own invoice.

### Final expected result

Invoice PDF works from the lease billing section, not only Payment Hub.

---

## Test 6 — Tenant downloads maintenance PDF (single + list)

**Login as:** Tenant

### Steps

1. In the sidebar, click **Maintenance** (or go to `/tenant/maintenance`).
2. If the list is empty, create a request first (**New Request**), then continue.
3. On a request card, click **Download PDF**.
4. Open that PDF.
5. At the top of the page, click **Export maintenance PDF**.
6. Open the list PDF.

### Expected

| Step | Expected |
|------|----------|
| Single download | PDF with title, status, category, priority, property/unit, description. |
| List export | PDF listing the tenant’s maintenance requests. |
| Scope | Only this tenant’s tickets. |

### Final expected result

Tenant can export both a single maintenance request and a full list as PDF.

---

## Test 7 — Landlord downloads lease PDF (active leases)

**Login as:** Landlord / Owner

### Steps

1. Log in with the landlord account (lands on `/landlord` or `/owner`).
2. In the sidebar, open **Finances**, then go to **Active leases**  
   (or navigate to `/landlord/finances/active-leases` / `/owner/finances/active-leases`).
3. On a row for an accepted lease, click **Download lease PDF**.
4. Open the PDF.

### Expected

| Step | Expected |
|------|----------|
| Active leases table | Shows accepted contracts for **this landlord’s** properties. |
| Download | Success toast + PDF. |
| PDF | Same contract details; tenant name matches the row. |

### Final expected result

Landlord can download lease PDFs for leases on properties they own.

---

## Test 8 — Landlord downloads lease PDF from application detail

**Login as:** Landlord / Owner

### Steps

1. Go to **Applications** (`/landlord/applications` or `/owner/applications`).
2. Open an application that already has a contract.
3. In the **Lease contract** section, click **Download lease PDF**.
4. Open the PDF.

### Expected

Download succeeds when a contract exists; PDF matches the contract on screen.

### Final expected result

Lease PDF is available from the owner application detail page.

---

## Test 9 — Landlord financial summary + invoice PDFs

**Login as:** Landlord / Owner

### Steps

1. Go to **Finances → Reports** (`/landlord/finances` or `/owner/finances`).
2. Click **Export financial summary**.
3. Open the financial summary PDF.
4. Click **Export invoices PDF**.
5. Open the invoices statement PDF.
6. In **All pending invoices**, select a row and click **Download invoice**.
7. Open the single invoice PDF.
8. *(Optional)* Open a filtered view via Active leases → **Billing** (`?leaseContractId=…`), then export invoices again and confirm the filter is reflected where applicable.

### Expected

| Step | Expected |
|------|----------|
| Financial summary PDF | Collected (PAID), outstanding (PENDING), counts, monthly breakdown; currency TZS. |
| Export invoices PDF | Pending invoices for this landlord’s properties. |
| Single invoice PDF | Matches selected invoice. |
| Charts on page | Still visible (PDF export does not replace on-screen reports). |

### Final expected result

Landlord can export financial summary, invoice list, and individual invoice PDFs from Finances.

---

## Test 10 — Landlord maintenance PDFs (queue)

**Login as:** Landlord / Owner

### Steps

1. Go to **Maintenance** (`/landlord/maintenance` or `/owner/maintenance`).
2. Optionally set status / priority / property filters.
3. Click **Export maintenance PDF**.
4. Open the list PDF and confirm it respects the current filters (as much as possible).
5. On a row, click **Download PDF**.
6. Open the single request PDF.

### Expected

| Step | Expected |
|------|----------|
| List export | PDF of requests on the landlord’s properties (filtered when filters are set). |
| Single download | PDF for that request only. |

### Final expected result

Landlord can export maintenance list and single-request PDFs from the queue.

---

## Test 11 — Cross-role / access boundaries (important)

**Login as:** Tenant, then Landlord (separate sessions)

### Steps

1. As **tenant**, note an invoice id or lease id from a downloaded PDF filename (e.g. `invoice-12.pdf`).
2. Log out.
3. Log in as **landlord** and confirm you can download PDFs for **your** properties.
4. As **tenant**, confirm you **cannot** see landlord-only UI:
   - No Finances / Active leases / financial summary export in the tenant sidebar.
5. As **landlord**, confirm you do **not** see tenant Payment Hub / tenant Maintenance Portal routes as your home UI.
6. *(Stronger check, if you have two landlords or two tenants)*  
   Try to access another party’s data only through the UI you have. You should never see download buttons for records that do not appear in your lists.

### Expected

| Step | Expected |
|------|----------|
| Tenant UI | Only tenant lease/payments/maintenance download actions. |
| Landlord UI | Finances + maintenance queue exports; no tenant-only pages. |
| Lists | Each role only sees their scoped rows before downloading. |

### Final expected result

Exports follow the same access level as the rest of the app: tenant = self; landlord = owned properties.

> **Cannot fully verify from codebase alone without real multi-tenant data:** Whether guessing another user’s id in a crafted URL returns 403. That needs an authenticated API or browser network check with a second account’s id. The UI does not expose other users’ ids for download.

---

## Test 12 — Empty / edge cases

**Login as:** Tenant or Landlord (as appropriate)

### Steps

1. As tenant with **no** pending invoices: open Payment Hub → click **Export invoices PDF**.
2. As landlord with **no** maintenance rows for a filter: set filters so the table is empty → click **Export maintenance PDF**.
3. Open both PDFs.

### Expected

| Step | Expected |
|------|----------|
| Empty invoice export | PDF still downloads; shows an empty-state message (e.g. no matching invoices). |
| Empty maintenance export | PDF still downloads; empty-state message in the table. |
| No crash | No error page; toast may still say download succeeded. |

### Final expected result

Empty exports fail gracefully with a readable PDF, not a broken download.

---

## Quick checklist (pass / fail)

| # | Scenario | Pass? |
|---|----------|-------|
| 1 | Tenant lease PDF (lease desk) | |
| 2 | Tenant lease PDF (application detail) | |
| 3 | Tenant single invoice PDF (Payment Hub) | |
| 4 | Tenant invoice list PDF | |
| 5 | Tenant invoice PDF (lease billing) | |
| 6 | Tenant maintenance single + list PDF | |
| 7 | Landlord lease PDF (active leases) | |
| 8 | Landlord lease PDF (application detail) | |
| 9 | Landlord financial summary + invoice PDFs | |
| 10 | Landlord maintenance single + list PDF | |
| 11 | Role UI boundaries | |
| 12 | Empty export PDFs | |

---

## Known gaps / notes for testers

1. **Date range picker is not wired in the UI.** Backend supports `from` / `to` query params, but the current screens export with status/property/lease filters only (no calendar date-range control on the export buttons).
2. **Contract create/edit dialog** (`ApplicationContractDialog`) does not have its own Download PDF button; use **Application detail** or **Active leases** instead.
3. **Admin accounts** are out of scope for this module (no admin report export UI intended).
4. **Success toasts** are English hardcoded in the download hooks; button labels use i18n (`en` / `sw`).
