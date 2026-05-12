---
name: Visual Property Map feature
overview: Implement the Visual Property Map feature (V2 image-overlay approach) as a continuation of the prerequisite plan. Delivers public floor map browsing and admin tooling for floor plan upload + overlay editing. Domain strategy — Option B (Property as building root); see backend visualmap README.
todos:
  - id: vm-00-domain-design
    content: Choose the backend domain integration strategy (new VisualMap domain vs integrating under existing Property) and define the minimal entity relationships and endpoint paths.
    status: completed
  - id: vm-01-backend-persistence
    content: Add backend entities + repositories for floor plans and overlays (and building/floor/unit if new domain), ensuring efficient queries (avoid N+1).
    status: completed
  - id: vm-02-backend-storage-serving
    content: Implement floor plan image storage and safe public serving with a stable URL scheme.
    status: completed
  - id: vm-03-backend-apis
    content: Implement public + admin Visual Map APIs and wire RBAC + validation + error shapes.
    status: completed
  - id: vm-04-frontend-api-hooks
    content: Implement webapp API layer + React Query hooks for floor map retrieval and admin mutations.
    status: completed
  - id: vm-05-frontend-public-ui
    content: Implement floor map page (image + overlays + selection panel) with accessibility and loading/error states.
    status: completed
  - id: vm-06-frontend-admin-ui
    content: Implement admin pages for uploading floor plans and drawing/saving overlays, including unit status toggling.
    status: completed
  - id: vm-07-tests-quality
    content: Add focused backend integration tests and frontend component tests for overlay math and permission gates.
    status: pending
isProject: false
---

## Assumptions (explicit)

- Prerequisites plan is complete: auth works, RBAC is enforced, API client exists.
- We implement **V2** (image overlay) and do not ship V1 SVG grid in this iteration.
- Visual Map endpoints live under backend base prefix `/api/v1` (consistent with existing backend `Constants.API_V1`).

## Step-by-step implementation plan

### 0) Domain design (small but critical)

**Selected: Option B** — integrate under existing `Property` (see `property-management/src/main/java/dev/hud/PropertyManagementSystem/visualmap/README.md`).

Pick one and document it in code as a module-level README:

- **Option A (recommended for speed/clarity)**: Create a new module:
  - `Building` → has many `Floor`
  - `Floor` → has many `Unit`
  - `FloorPlan` (1:1 with floor) + `UnitOverlay` (1:1 with unit)
- **Option B (integration)**: Treat existing `Property` as “building” and attach floors/units under it.

Deliverable:

- A short design note: naming, table names, and endpoint namespace.

### 1) Backend persistence (entities + repos)

Backend package structure (best-practice modularization):

- `dev.hud.PropertyManagementSystem.models.visualmap.*`
- `dev.hud.PropertyManagementSystem.repositories.visualmap.*`
- `dev.hud.PropertyManagementSystem.services.visualmap.*`
- `dev.hud.PropertyManagementSystem.controllers.visualmap.*`
- `dev.hud.PropertyManagementSystem.payloads.responses.visualmap.*`

Todos:

- Add entities:
  - `FloorPlan` with `floorId` (or `@OneToOne Floor`) + `imagePath`, `imageWidth`, `imageHeight`, `uploadedAt`
  - `UnitOverlay` with `unitId` (or `@OneToOne Unit`) + `xPct`, `yPct`, `wPct`, `hPct`
  - If Option A: `Building`, `Floor`, `Unit` + `UnitStatus` enum (`AVAILABLE|OCCUPIED`)
- Add repositories:
  - `FloorPlanRepository.findByFloorId(floorId)`
  - `UnitOverlayRepository.findAllByFloorId(floorId)` (single query to avoid N+1)

### 2) Backend storage + public serving (floor plan images)

Todos:

- Implement `FloorPlanStorageService` with:
  - deterministic filename scheme (floorId + timestamp/uuid)
  - directory creation
  - file extension validation + content-type checks
- Configure public serving:
  - serve uploaded images from a static path prefix (e.g. `/images/floor-plans/...`)
  - return an `imageUrl` from API that the webapp can use directly
- Keep storage concerns isolated (so future S3 swap is localized to this service).

### 3) Backend APIs (public + admin)

Public endpoint:

- `GET /api/v1/floors/{floorId}/map`
  - Returns a single `FloorMapResponse`:
    - `floorId`, `floorLabel` (if modeled), `imageUrl`, `units[]`
    - each unit includes: `unitId, unitNumber, bedrooms, sizeM2, monthlyRent, status, xPct, yPct, wPct, hPct`

Admin endpoints (RBAC enforced server-side):

- `POST /api/v1/admin/floors/{floorId}/plan` (multipart: `file`, `imageWidth`, `imageHeight`)
- `PUT /api/v1/admin/floors/units/{unitId}/overlay` (JSON overlay request)
- `PATCH /api/v1/admin/floors/units/{unitId}/status` (JSON status request)

Todos:

- Add DTOs as records in `payloads.responses.visualmap` and request records in `payloads.requests.visualmap`.
- Add `FloorMapService`:
  - `getFloorMap(floorId)` joins floor plan + overlays + units
  - `uploadFloorPlan(floorId, file, w, h)` replaces existing safely
  - `saveUnitOverlay(unitId, ...)` upserts overlay
  - `toggleUnitStatus(unitId, ...)`
- Ensure error shape follows existing cross-cutting conventions (Feature 0).

### 4) Webapp API + hooks (React Query)

Todos:

- Add `src/api/floorMapApi.ts` with:
  - `getFloorMap(floorId)`
  - `uploadFloorPlan(floorId, formData)`
  - `saveUnitOverlay(unitId, overlay)`
  - `toggleUnitStatus(unitId, status)`
- Add `src/hooks/useFloorMap.ts` with:
  - `useFloorMap(floorId)` query
  - `useSaveOverlay(floorId)` mutation + invalidate `['floor-map', floorId]`
  - `useToggleUnitStatus(floorId)` mutation + invalidate
- Add Zod schemas for API responses if you’re validating runtime payloads.

### 5) Webapp public UI (floor plan view)

New components (isolate UI under one module folder):

- `src/components/visual-map/FloorMap.tsx`
- `src/components/visual-map/UnitOverlay.tsx`
- `src/components/visual-map/UnitInfoPanel.tsx`
- `src/components/visual-map/MapLegend.tsx`

New page + route:

- `src/pages/FloorMapPage.tsx` routed at (example):
  - `/floors/:floorId/map`

Todos:

- Implement image container (`position: relative`) + overlay rendering (absolute positioned `%`).
- Interactions:
  - Occupied → not clickable (pointer-events none)
  - Available → select; show info panel; CTA wires to next business action (enquire/apply)
- UX quality:
  - Loading skeleton, error message, empty-state if no plan/overlays
  - Accessibility: aria-labels, keyboard navigation where feasible

### 6) Webapp admin UI (upload + overlay editor)

Admin routes/pages (behind `RequireRole`):

- `src/pages/admin/VisualMapAdmin.tsx` (index)
  - Select building/floor
  - Upload plan image
  - Overlay editor: drag-to-draw bounding box, save overlay
  - Toggle unit status

Todos:

- Implement an `OverlayEditor` component (mouse drag → compute `%` box → save).
- Guardrails:
  - constrain percentages to 0–100
  - minimum box size threshold to avoid accidental clicks
  - show “saving…” state and optimistic UI only if safe

### 7) Tests + quality gates

Backend (minimum):

- Integration tests for:
  - public map endpoint success and shape
  - admin endpoints require admin role
  - upload replaces old plan cleanly

Frontend (minimum):

- Component tests:
  - `%` math conversion correctness (drag box → xPct/yPct/wPct/hPct)
  - occupied unit has no click handler / correct styling state

## Definition of Done (for this feature)

- Public floor map works on mobile + desktop (responsive image + correct overlay alignment).
- Admin can upload a floor plan and define overlays without manual DB edits.
- Backend enforces admin-only endpoints; frontend guards are in place.
- Code is organized by module boundaries (no ad-hoc cross-imports), and APIs are typed/validated.
