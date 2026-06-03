# Module 6 — Maintenance Management — Manual Test Plan

Frontend/user-flow testing for the maintenance ticket feature.  
Backend API base: `/api/v1/maintenance` (via frontend `VITE_API_BASE_URL`, often `http://localhost:8081` locally).

---

## Before you start

### Services to run

1. **Backend:** `property-management` Spring Boot app running and connected to PostgreSQL.
2. **Frontend:** `property-management-webapp` dev server (`npm run dev`, usually `http://localhost:5173`).

### Test accounts required

You need **two active accounts** in the system:

| Role | Backend role | Used for |
|------|--------------|----------|
| **Tenant** | `TENANT` (or `USER` mapped to tenant UI) | Submitting and viewing own tickets |
| **Landlord / Owner** | `LAND_LORD` | Viewing queue and updating ticket status |

**Important precondition:** The tenant must have at least one **`ACCEPTED` lease contract** on a unit that belongs to a property owned by the landlord account. Without this, the tenant cannot submit a maintenance request (the create form will show no leased units or submission will fail).

> **Cannot verify from codebase alone:** Your exact login emails/passwords and whether accepted lease data already exists in your database. Set this up through the normal application → approve → contract → tenant accept flow before testing maintenance.

### Suggested test data setup (if starting fresh)

1. Log in as **landlord** → ensure at least one property with a unit exists.
2. Log in as **tenant** → apply/book a unit on that property.
3. As **landlord** → approve application and send/complete lease contract.
4. As **tenant** → accept the lease contract until status is **ACCEPTED**.
5. Then run the tests below.

---

## Test 1 — Tenant submits a maintenance request

**Login as:** Tenant

### Steps

1. Open the app and log in with the tenant account.
2. In the left sidebar, click **Maintenance** (or go to `/tenant/maintenance`).
3. Click **New Request**.
4. In the dialog:
   - **Leased unit:** Select a unit from the dropdown (must show property + unit).
   - **Title:** Enter at least 5 characters, e.g. `Kitchen sink leak`.
   - **Description:** Enter at least 10 characters describing the issue.
   - **Category:** Choose e.g. `Plumbing`.
   - **Priority:** Choose e.g. `High`.
   - *(Optional)* Add 1–2 photos using the image upload button.
5. Click **Submit request**.

### Expected at each step

| Step | Expected |
|------|----------|
| Open Maintenance page | Page title **Maintenance Portal**; list loads (may be empty). |
| New Request dialog | Unit dropdown lists only units with **accepted** leases. |
| Submit | Success toast; dialog closes. |
| List after submit | New card appears with title, **SUBMITTED** status badge, priority badge, property/unit, and date. |

### Final expected result

Tenant sees their new ticket in the list with status **SUBMITTED**.

---

## Test 2 — Tenant views ticket details

**Login as:** Tenant (same session or re-login)

### Steps

1. Go to **Maintenance** (`/tenant/maintenance`).
2. On a ticket card, click the **expand** control (chevron).
3. *(Optional)* If photos were uploaded, click a thumbnail.

### Expected

| Step | Expected |
|------|----------|
| Expand | Description text is visible. |
| With photos | Thumbnails render; clicking opens image in a new tab. |
| Resolved tickets | If landlord added resolution notes, they appear in the expanded section. |

### Final expected result

Tenant can read full ticket details without leaving the portal.

---

## Test 3 — Tenant overview shows maintenance summary

**Login as:** Tenant

### Steps

1. In the sidebar, click **Overview** (`/tenant`).
2. Find the **Open Tickets** KPI card (third card in the top row).
3. Scroll to the **Maintenance Status** panel on the right.
4. Click **View maintenance portal →** or **View all**.

### Expected

| Step | Expected |
|------|----------|
| Open Tickets card | Shows count of open (non-resolved/closed) tickets; latest open ticket title if any. |
| Maintenance Status timeline | Lists recent tickets with status badges. |
| Links | Navigate to `/tenant/maintenance`. |

### Final expected result

Overview reflects real maintenance data (not hardcoded mock tickets).

---

## Test 4 — Landlord sees tenant request in queue

**Login as:** Landlord (property owner of the tenant’s leased unit)

### Steps

1. Log out tenant; log in as landlord.
2. In the sidebar, click **Maintenance** (or go to `/owner/maintenance` or `/landlord/maintenance`).
3. Locate the row for the ticket created in Test 1.

### Expected

| Step | Expected |
|------|----------|
| Maintenance nav item | **Maintenance** appears in owner sidebar with wrench icon. |
| Queue page | Title **Maintenance queue**; table lists the tenant’s request. |
| Row content | Tenant name/email, property, unit, issue title, priority, **SUBMITTED** status, submitted date. |

### Final expected result

Landlord sees the tenant’s ticket in their queue.

---

## Test 5 — Landlord updates ticket status and adds notes

**Login as:** Landlord

### Steps

1. On **Maintenance queue**, find the ticket from Test 1.
2. Click **Update** on that row.
3. In the dialog:
   - Change **Status** to `UNDER REVIEW`, then save *(optional intermediate step)*.
   - Open **Update** again; set **Status** to `IN PROGRESS`.
   - Add **Resolution notes**, e.g. `Plumber scheduled for tomorrow.`
   - Set **Status** to `RESOLVED`.
4. Click **Save changes**.

### Expected

| Step | Expected |
|------|----------|
| Update dialog | Shows ticket title, property/unit, current status. |
| Save | Success toast; dialog closes; table row shows new status badge. |
| After RESOLVED | Status badge shows **RESOLVED**. |

### Final expected result

Ticket status and resolution notes are persisted; landlord queue reflects updates.

---

## Test 6 — Tenant sees landlord updates

**Login as:** Tenant

### Steps

1. Log in as tenant.
2. Go to **Maintenance** (`/tenant/maintenance`).
3. Refresh the page if the list was already open.
4. Expand the updated ticket.

### Expected

| Step | Expected |
|------|----------|
| List | Status badge shows **RESOLVED** (or last status set by landlord). |
| Expanded view | Resolution notes from landlord are visible. |

### Final expected result

Tenant sees the same status and notes the landlord set (end-to-end flow complete).

---

## Test 7 — Queue filters (landlord)

**Login as:** Landlord (with multiple tickets if possible)

### Steps

1. Open **Maintenance queue**.
2. Use the **Status** filter dropdown → select `SUBMITTED` (or another status).
3. Use the **Priority** filter → select `URGENT` (if such tickets exist).
4. If you own multiple properties with tickets, use the **Property** filter.

### Expected

| Step | Expected |
|------|----------|
| Status filter | Table shows only tickets matching selected status. |
| Priority filter | Table narrows to matching priority. |
| Property filter | Only shown when multiple properties have tickets; filters list correctly. |

### Final expected result

Filters change the visible rows without errors.

---

## Test 8 — Tenant without accepted lease cannot submit

**Login as:** Tenant account with **no accepted lease** on any unit

### Steps

1. Log in as that tenant.
2. Go to **Maintenance** → **New Request**.

### Expected

- Unit dropdown shows message like *You need an accepted lease before submitting maintenance requests*, **or**
- Submit is disabled / submission fails with an error toast.

### Final expected result

No maintenance ticket is created without an active lease.

---

## Test 9 — Duplicate open ticket (same unit)

**Login as:** Tenant with an accepted lease who already has an **open** ticket on that unit

### Steps

1. Submit one maintenance request for a unit (Test 1).
2. Without closing/resolving it, click **New Request** again for the **same unit** and try to submit.

### Expected

- Second submission fails with an error message (duplicate open request for that unit).

### Final expected result

Only one open ticket per tenant per unit at a time.

> **Note:** Exact error message text may vary; confirm behavior manually.

---

## Test 10 — Data isolation (two tenants)

**Requires:** Two different tenant accounts on different leases.

### Steps

1. Tenant A submits a ticket.
2. Log in as Tenant B.
3. Open **Maintenance** and **Overview**.

### Expected

- Tenant B does **not** see Tenant A’s ticket title, description, or details.

### Final expected result

Each tenant only sees their own maintenance requests in the UI.

> **Cannot verify from codebase alone:** Full cross-tenant API leak testing requires two tenant sessions and manual or API inspection. UI list scoping should hide other tenants’ data.

---

## Test 11 — Wrong landlord cannot update another owner’s ticket

**Requires:** Two landlord accounts owning different properties.

### Steps

1. Tenant on Landlord A’s property submits a ticket.
2. Log in as Landlord B (does not own that property).
3. Open **Maintenance queue**.

### Expected

- Landlord B does **not** see the ticket in their queue.
- *(Optional API check via Scalar)* Direct update by wrong owner returns forbidden.

### Final expected result

Landlords only manage maintenance for their own properties.

---

## Acceptance checklist (from plan)

| Criterion | How to verify |
|-----------|----------------|
| Tenant with accepted lease submits → appears in owner queue | Tests 1 + 4 |
| Tenant without lease blocked | Test 8 |
| Owner updates to RESOLVED → tenant sees update | Tests 5 + 6 |
| Cross-tenant leakage prevented | Test 10 |
| Property listing `MAINTENANCE` status unrelated | Out of scope for this module; no UI change expected on property inventory |

---

## Out of scope (not in this module)

Do **not** expect these during testing:

- Caretaker / assignee on tickets
- In-app or email notifications when status changes (Feature 7)
- Admin maintenance dashboard in the frontend (backend may support admin API access)
- Pagination on long ticket lists
- Dedicated “get by id” detail page (list + expand covers tenant view)

---

## Known verification gaps (implementation review)

These were **not** fully verified during development:

| Item | Status |
|------|--------|
| Authenticated API scenarios F6-01–F6-08 via Scalar | **Not run** — DB lacked tenant + accepted lease at verification time |
| Automated unit/integration tests | **None** — no test suite in backend repo |
| End-to-end browser test with real login | **Manual only** — follow this document |
| Photo upload against live file API | **Code present** — confirm manually in Test 1 |

---

## Quick reference — URLs

| Page | Path |
|------|------|
| Tenant overview | `/tenant` |
| Tenant maintenance portal | `/tenant/maintenance` |
| Owner maintenance queue | `/owner/maintenance` or `/landlord/maintenance` |
