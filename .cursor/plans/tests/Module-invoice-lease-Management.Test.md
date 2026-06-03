# Invoice & Lease Management — Manual UI Test Plan

**Plan reference:** `invoice_lease_management_f4ff9d17.plan.md`  
**App URLs (defaults):** Frontend `http://localhost:5173` · Backend `http://localhost:8080` (or your `application.properties` port)

This document is for **human testers** clicking through the web app. It does not replace API or database checks.

---

## Before you start

### Services

| Service | How to run |
|--------|------------|
| Backend | Start Spring Boot (`property-management`) |
| Frontend | `npm run dev` in `property-management-webapp` |
| Database | PostgreSQL reachable with your local config |

### Accounts you need

| Role | Used for | Notes |
|------|----------|--------|
| **Property owner (landlord)** | Owner flows | Role `LAND_LORD` / owner dashboard at `/owner` or `/landlord` |
| **Tenant** | Tenant flows | Role `TENANT` / dashboard at `/tenant` |

Use **two separate accounts** (or register two users). The owner must own the property; the tenant must be the applicant/tenant on the lease contract.

### Test data prerequisite (required)

You need **one accepted lease contract** before billing tests mean anything:

1. Tenant submits a booking/application for a unit.
2. Owner approves and prepares/sends a lease contract with at least one billable line item (amount, dates, recurring rules if applicable).
3. Tenant opens the application, reviews the contract, and **accepts** it.
4. Contract status becomes **ACCEPTED**.

If this pipeline is not complete, invoice screens will be empty or disabled.

### What was verified from code (not a full QA sign-off)

- All six plan TODOs are marked **completed** in the plan file.
- Frontend production build (`npm run build`) succeeded during implementation.
- ESLint passed on new invoice-related files during implementation.
- **Not verified in this review:** live end-to-end runs, scheduled job at 06:00 Africa/Dar_es_Salaam, RBAC negative tests, or automated test suites.

---

## Implementation review summary

### 1. Are all plan items completed?

| Plan item | Status | Notes |
|-----------|--------|--------|
| Backend: invoice entity, schedule service, invoice service, controller | **Done** | List, get, billable-periods, manual create |
| Backend: pay-mobile, mark-paid, scheduler, auto job | **Done** | `invoice.auto-generate-days-before=7` in example + typical local `application.properties` |
| Frontend: `leaseSchedule.ts` + contract page refactor | **Done** | `ApplicationContractDialog`, `TenantApplicationDetail` |
| Frontend: schema, API, queries, shared components | **Done** | See partial gaps below |
| Frontend: tenant Payment Hub, lease active panel, dialogs | **Done** | |
| Frontend: owner Financial Reports, Active Leases, routing | **Done** | Routes: `/owner/finances`, `/owner/finances/active-leases` (and `/landlord/...`) |

**Plan Phase 6 (polish & verification)** is **not a separate completed TODO**. Cross-cutting polish and edge-case hardening were only partially addressed (see gaps).

### 2. Was everything verified properly?

| Area | Verification level |
|------|-------------------|
| Code exists and compiles | Yes (build during dev) |
| Manual UI flows | **You must run** this test plan |
| Auto-invoice daily job | **Cannot confirm** without waiting for cron or checking DB/logs |
| FE/BE schedule date parity | **Not formally verified** (no shared automated test vectors) |
| RBAC (wrong role blocked) | **Not verified** from UI doc alone |

### 3. Gaps, partial, or out-of-scope items

| Item | State |
|------|--------|
| `InvoiceDetailCard` component | **Built but not used** on any page (table/card UIs used instead) |
| `TenantOverview` invoice KPIs | **Not done** (plan listed as optional polish) |
| `lib/simulatedPayment.ts` (frontend) | **Not created** (simulation is backend-only; UI uses API) |
| Backend unit / RBAC tests | **Not present** in repo |
| `CANCELLED` invoice UI flows | **No UI** to cancel invoices (enum exists) |
| Real M-Pesa/Tigo | **Out of scope** (simulated pay always succeeds) |
| Email/notifications on due invoices | **Out of scope** |
| i18n for billing strings | **Out of scope** (English UI) |
| Export statement button | **Removed** with Financial Reports rebuild (was mock-only) |
| `periodsPaid / periodsTotal` KPI | **Partial** — outstanding/next due shown; full ratio not on all screens |
| Duplicate manual invoice request | Should error in UI — **test in Flow 4** |

---

## Flow 0 — Prerequisite: accepted lease contract

**Login:** Owner, then Tenant (separate sessions or browsers).

### Owner

1. Log in → sidebar **Applications** (`/owner/applications` or `/landlord/applications`).
2. Open a **PENDING** application → approve if needed.
3. Open contract workflow → add contract items (label, amount, start date, recurring settings if used).
4. Set **Payment day of month** (1–28) on the contract.
5. **Send** contract so status is **SENT**.

**Expected:** Contract saved; tenant can see it.

### Tenant

1. Log in → sidebar **Lease** (`/tenant/lease`).
2. Open the application row → **View** (or **Review** if contract is SENT).
3. On application detail, scroll to contract section → accept terms → **Accept contract**.

**Expected:** Contract status **ACCEPTED**; owner/tenant lease views show active tenancy where implemented.

---

## Flow 1 — Contract schedule shows payment day (tenant)

**Login:** Tenant  
**Where:** `/tenant/lease` → **View** on the accepted application.

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open application with **ACCEPTED** contract | Contract schedule section loads |
| 2 | Check schedule rows for **monthly/yearly** items | Due dates should reflect contract **payment day** (not only raw item start date) |
| 3 | Check **Payment day** in contract panel | Shows day 1–28 from contract |

**Pass criteria:** Schedule is visible and dates look consistent with contract terms (visual check).

---

## Flow 2 — Owner contract preview schedule (owner)

**Login:** Owner  
**Where:** Applications → open application → contract dialog (draft/edit).

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Edit contract items and **Payment day of month** | Schedule preview updates |
| 2 | Change payment day | Preview due dates shift for monthly/yearly lines |

**Pass criteria:** Owner sees schedule preview before send; payment day affects preview.

---

## Flow 3 — Tenant: active tenancy panel

**Login:** Tenant  
**Where:** `/tenant/lease`

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | After contract **ACCEPTED**, load Lease page | **Active tenancy** panel appears (property, unit, dates) |
| 2 | Read **Outstanding**, **Next due**, **Payment day** | Values load (may be zero/— if no invoices yet) |
| 3 | Click **Payments** | Navigates to `/tenant/payments` |
| 4 | Click **Request invoice** | **Request invoice** dialog opens |

**Pass criteria:** Panel only for accepted lease; navigation works.

---

## Flow 4 — Tenant: request manual invoice (cash)

**Login:** Tenant  
**Where:** `/tenant/lease` or `/tenant/payments` → **Request invoice**

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open **Request invoice** | Dialog lists **billable periods** (uninvoiced schedule lines) |
| 2 | Select a period | Amount and due date shown in dropdown |
| 3 | Choose **Cash (owner confirmation)** | Payment method selected |
| 4 | Click **Request invoice** | Success toast; dialog closes |
| 5 | Go to **Payments** (`/tenant/payments`) | New row in **Outstanding invoices** with **CASH**, status **PENDING** |
| 6 | Try **Request invoice** again for the **same period** | Should fail with error (duplicate period) |

**Pass criteria:** Invoice created; duplicate blocked.

---

## Flow 5 — Tenant: request manual invoice (mobile) and pay

**Login:** Tenant  
**Where:** `/tenant/payments`

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | **Request invoice** → pick another billable period → **Mobile** | Invoice created |
| 2 | In outstanding table, find **MOBILE** row → click **Pay** | **Pay with mobile money** dialog opens |
| 3 | Optionally enter phone; pick M-Pesa/Tigo (cosmetic) | |
| 4 | Click **Pay now** | Spinner, then success; confetti-style celebration |
| 5 | Refresh or wait for list update | Invoice **disappears** from pending list (status **PAID**) |

**Pass criteria:** Simulated mobile payment always succeeds; balance due decreases.

---

## Flow 6 — Tenant: Payment Hub summary

**Login:** Tenant  
**Where:** `/tenant/payments`

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | With pending invoices | Green **Balance due** card shows sum of pending amounts |
| 2 | | **Next due** shows earliest pending due date |
| 3 | With only MOBILE pending (single invoice) | **Pay … now** shortcut may appear on card |
| 4 | With no pending invoices | Balance **0** / empty state message |

**Pass criteria:** Hub reflects API data, not hardcoded mock amounts.

---

## Flow 7 — Tenant: billing on application detail

**Login:** Tenant  
**Where:** `/tenant/lease/{applicationId}` for **ACCEPTED** contract

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Scroll to **Billing & invoices** | Section visible only when contract **ACCEPTED** |
| 2 | | Shows outstanding summary and invoice table |
| 3 | **Open payment hub** link | Goes to `/tenant/payments` |
| 4 | **Pay** on a MOBILE pending row | Mobile pay dialog works (same as Flow 5) |

**Pass criteria:** Invoice section tied to accepted contract.

---

## Flow 8 — Owner: mark cash invoice paid

**Login:** Owner  
**Where:** `/owner/finances` (or `/landlord/finances`)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Ensure tenant created a **CASH** pending invoice (Flow 4) | |
| 2 | Open **Finances** in sidebar | **Financial reports** loads with KPIs and chart |
| 3 | In **Outstanding balances** or **All pending invoices** | CASH invoice listed |
| 4 | Click **MARK PAID** or **Mark paid** | Confirmation dialog |
| 5 | Confirm **Mark as paid** | Success toast; invoice leaves pending lists |
| 6 | Check **Collected (paid)** KPI / chart | Increases after paid invoices exist |

**Pass criteria:** Owner can confirm cash; revenue chart uses paid invoices.

---

## Flow 9 — Owner: active leases and filtered billing

**Login:** Owner  
**Where:** `/owner/finances/active-leases`

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Click **Active leases** tab (or navigate to URL above) | Table of **ACCEPTED** contracts |
| 2 | Check columns | Tenant, property/unit, outstanding, collected, next due |
| 3 | Click **Billing** on a row | Opens `/owner/finances?leaseContractId={id}` |
| 4 | On reports page | Filter banner shows lease id; lists scoped to that contract |
| 5 | Click **Clear filter** | Full owner invoice view again |

**Pass criteria:** Active lease hub links to per-contract billing.

---

## Flow 10 — Auto-generated invoice (optional / timing-dependent)

**Login:** Tenant and/or Owner  
**Cannot fully verify from UI alone** — depends on scheduler and dates.

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Ensure backend has `invoice.auto-generate-days-before=7` | Job creates AUTO **MOBILE** invoices |
| 2 | Use a contract whose schedule has a due date **within the next 7 days** and **no invoice** yet for that period | |
| 3 | Wait for daily job (**06:00 Africa/Dar_es_Salaam**) **or** ask a developer to trigger `InvoiceGenerationJob` / run generation once | |
| 4 | Tenant → **Payments** | New **PENDING** invoice, source **AUTO**, method **MOBILE** |

**Pass criteria:** AUTO invoice appears without manual request.  
**If it does not appear:** check server logs, contract ACCEPTED, due date window, and existing `scheduleKey` in DB.

---

## Flow 11 — Negative checks (quick)

| Who | Try | Expected |
|-----|-----|----------|
| Tenant | Pay a **CASH** invoice via mobile pay button | Pay button not offered or pay fails (MOBILE-only endpoint) |
| Tenant | **Request invoice** with no **ACCEPTED** contract | Warning on Payment Hub; request disabled |
| Owner | View finances | Sees only invoices for **their** properties |
| Tenant | View payments | Sees only **their** invoices |

**Note:** Exact error messages may vary; confirm users cannot cross access other landlords’ data.

---

## Expected final state (full happy path)

After Flows 0–9:

1. One **ACCEPTED** lease contract exists.
2. Tenant has at least one **PAID** invoice (mobile) and one **PAID** invoice (cash, marked by owner), or equivalent.
3. **Payment Hub** balance due matches remaining **PENDING** only.
4. **Owner Financial reports** show paid revenue in chart and reduced outstanding.
5. **Active leases** row reflects updated outstanding/collected totals.

---

## Tester sign-off checklist

- [ ] Flow 0 — Accepted contract
- [ ] Flow 1 — Tenant schedule / payment day
- [ ] Flow 2 — Owner contract preview
- [ ] Flow 3 — Active tenancy panel
- [ ] Flow 4 — Manual invoice (cash)
- [ ] Flow 5 — Manual invoice (mobile) + pay
- [ ] Flow 6 — Payment Hub
- [ ] Flow 7 — Application billing section
- [ ] Flow 8 — Owner mark paid
- [ ] Flow 9 — Active leases + filter
- [ ] Flow 10 — Auto invoice (if applicable)
- [ ] Flow 11 — Negative checks

**Tester name / date:** _______________  
**Build/commit tested:** _______________  
**Issues found:** _______________
