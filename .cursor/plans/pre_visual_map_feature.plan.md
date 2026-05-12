---
name: Pre Visual Map prerequisites
overview: Implement the required foundation plans (Feature 0/1/9) so the Visual Property Map feature can be built safely with real auth, RBAC, API client wiring, and clean configuration.
todos:
  - id: prereq-00-freeze-contracts
    content: Define and lock the minimal API contracts needed by Visual Map (auth token shape, role claim, and Visual Map endpoints) to prevent rework across FE/BE.
    status: completed
  - id: prereq-01-backend-security-enforcement
    content: Fix backend security so protected routes are actually protected (deny-by-default, method security enabled, ROLE_* alignment) and /api/admin/** is admin-only.
    status: completed
  - id: prereq-02-backend-config-hygiene
    content: Remove secrets from tracked config, introduce safe env-based configuration, and keep dev defaults documented.
    status: completed
  - id: prereq-03-backend-file-upload-readiness
    content: Fix/standardize file upload endpoint mapping and decide whether Visual Map will reuse FileService or have a dedicated FloorPlanStorageService.
    status: completed
  - id: prereq-04-frontend-api-client
    content: Add a shared webapp API client using VITE_API_BASE_URL, with token injection and basic 401 handling; remove demo-only login flow.
    status: completed
  - id: prereq-05-frontend-rbac-guards
    content: Add frontend role-based route guard(s) and apply them to admin routes to avoid exposing admin tooling to non-admin users.
    status: completed
isProject: false
---

## Context (what we must enable before Visual Map)

Visual Map V2 requires:

- **Public read**: unauthenticated users can fetch floor map data (image url + unit overlays).
- **Admin write**: authenticated admins can upload floor plan images and edit overlays/status.
- **Trustworthy security**: backend must enforce admin-only access; frontend guards are UX only.
- **Shared API client**: webapp must call real backend endpoints (no demo stubs).

## Step-by-step prerequisite plan

### 0) Lock minimal contracts (prevents FE/BE mismatch)

- **Define auth response contract** (backend → frontend):
  - Access token field name + refresh token field name
  - User payload fields and **role representation** (string enum)
- **Define RBAC mapping**:
  - Backend authorities: decide `ROLE_ADMIN` style and ensure `hasRole('ADMIN')` works.
  - Frontend role type: single source of truth mapping for route access.
- **Define Visual Map endpoint namespace** (use one prefix consistently):
  - Recommend: keep existing backend base prefix `Constants.API_V1` (`/api/v1`) and put Visual Map under it:
    - Public: `GET /api/v1/floors/{floorId}/map`
    - Admin: `POST /api/v1/admin/floors/{floorId}/plan`
    - Admin: `PUT /api/v1/admin/floors/units/{unitId}/overlay`
    - Admin: `PATCH /api/v1/admin/floors/units/{unitId}/status`

### 1) Backend security enforcement (Feature 1 + Feature 9 prerequisite slice)

Backend files involved:

- `property-management`: `/home/lynx/Desktop/property-management/src/main/java/dev/hud/PropertyManagementSystem/config/AppSecurityConfig.java`
- `property-management`: method security config class to add `@EnableMethodSecurity`
- `property-management`: `/home/lynx/Desktop/property-management/src/main/java/dev/hud/PropertyManagementSystem/models/Role.java`

Todos:

- Tighten `SecurityFilterChain`:
  - Permit only `/api/v1/auth/**` and swagger routes anonymously.
  - Require authentication for the rest (do **not** keep `anyRequest().permitAll()`).
  - Explicitly restrict `/api/v1/admin/**` to admin roles.
- Enable method security (`@EnableMethodSecurity`) so `@PreAuthorize` is actually enforced.
- Normalize authorities vs roles:
  - Ensure `UserPrincipal` emits `ROLE_*` authorities if you use `hasRole(...)`.
  - Ensure role naming consistency (`LAND_LORD` vs `LANDLORD`, etc.) to avoid guard bugs.
- Add a minimal “RBAC smoke test” checklist (manual is OK for now):
  - Non-admin calling any `/api/v1/admin/**` gets 403.
  - Missing token on protected endpoints gets 401.

### 2) Backend config hygiene (Feature 0 prerequisite slice)

Backend file involved:

- `/home/lynx/Desktop/property-management/src/main/resources/example.application.properties`

Todos:

- Remove/replace any real secrets with placeholders (JWT secret, email password).
- Move secrets to environment variables (document required keys).
- Keep example config for local dev but make it non-sensitive.

### 3) Backend file upload readiness (needed for floor plan images)

Backend file involved:

- `/home/lynx/Desktop/property-management/src/main/java/dev/hud/PropertyManagementSystem/controllers/FileController.java`

Todos:

- Fix multipart upload mapping so the route exists as intended (currently uses `@PostMapping(name=...)`).
- Decide storage strategy for Visual Map images:
  - **Option A (recommended)**: dedicated `FloorPlanStorageService` under Visual Map module (clean separation).
  - **Option B**: reuse `FileService` once it is correct; still keep Visual Map metadata separate.
- Define how images will be publicly served in dev:
  - Static mapping (e.g. `/images/**`) with path traversal protection.

### 4) Frontend shared API client (Feature 1 prerequisite slice)

Webapp files involved (current state shows placeholders):

- `/home/lynx/Desktop/property-management-webapp/src/queries/auth.queries.ts` (demo login)
- `/home/lynx/Desktop/property-management-webapp/src/store/slices/authSlice.ts`

Todos:

- Add `VITE_API_BASE_URL` and a shared API client module (`src/lib/apiClient.ts`):
  - baseURL from env
  - attach `Authorization: Bearer <token>`
  - minimal response handling: if 401 → logout (refresh token flow can be phase 2)
- Replace demo login with real backend call:
  - Call backend login endpoint.
  - Parse response into Redux auth state (token + user + role).

### 5) Frontend RBAC guards (Feature 9 prerequisite slice)

Webapp files involved:

- `/home/lynx/Desktop/property-management-webapp/src/helper/require-auth.tsx` (auth-only guard)
- `/home/lynx/Desktop/property-management-webapp/src/router.tsx` (routes)

Todos:

- Implement `RequireRole` guard (allowedRoles array).
- Apply to admin routes:
  - `/admin/**` should require `ADMIN` (and optionally `SUPER_ADMIN`).
- Keep tenant/owner branches consistent (even if Visual Map only needs admin now).

## Exit criteria (before starting Visual Map feature plan)

- Real login works end-to-end (webapp ↔ backend) and stores a usable Bearer token.
- Backend blocks non-admin access to `/api/v1/admin/**` with 403.
- Webapp admin routes are role-guarded (UX), but backend remains source of truth.
- File upload pathing is solved for floor plan images (dedicated service or fixed reuse).
