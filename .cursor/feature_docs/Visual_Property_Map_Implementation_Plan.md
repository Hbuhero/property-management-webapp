# Implementation Plan — Visual Property Map Feature
**Property Management System (FYP)**
**Version:** 1.0 | **Date:** May 2026 | **Stack:** React 18 + Spring Boot 3

---

## Table of Contents
1. [Overview](#overview)
2. [Phase 1 — Foundation & Backend](#phase-1--foundation--backend)
3. [Phase 2 — Frontend Core](#phase-2--frontend-core)
4. [Phase 3 — Admin Panel](#phase-3--admin-panel)
5. [Phase 4 — Polish & NFRs](#phase-4--polish--nfrs)
6. [Task Breakdown & Estimates](#task-breakdown--estimates)
7. [File & Folder Structure](#file--folder-structure)
8. [Key Technical Decisions](#key-technical-decisions)
9. [Testing Strategy](#testing-strategy)
10. [Definition of Done](#definition-of-done)

---

## Overview

The implementation is divided into **4 phases** designed to be delivered sequentially, each producing a testable increment. Total estimated effort: **~18–22 developer days** for a single developer.

```
Phase 1: Backend API + DB schema (5 days)
Phase 2: Frontend floor map UI (7 days)
Phase 3: Admin configuration panel (4 days)
Phase 4: Polish, testing, responsive (3 days)
```

---

## Phase 1 — Foundation & Backend

**Goal:** Deliver a working Spring Boot REST API with database schema and seed data.

### 1.1 Database Schema (Day 1)

Create Flyway migration `V1__visual_map_schema.sql`:

```sql
CREATE TABLE building (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    address     VARCHAR(500),
    type        ENUM('APARTMENT_BLOCK', 'STANDALONE_HOUSE') NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE floor (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    building_id  BIGINT NOT NULL REFERENCES building(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    label        VARCHAR(100),
    UNIQUE (building_id, floor_number)
);

CREATE TABLE unit (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    floor_id      BIGINT NOT NULL REFERENCES floor(id) ON DELETE CASCADE,
    unit_number   VARCHAR(20) NOT NULL,
    bedrooms      INT,
    size_m2       DECIMAL(7,2),
    monthly_rent  DECIMAL(10,2),
    status        ENUM('AVAILABLE', 'OCCUPIED') DEFAULT 'AVAILABLE',
    pos_x         INT DEFAULT 0,
    pos_y         INT DEFAULT 0,
    width_units   INT DEFAULT 1,
    height_units  INT DEFAULT 1
);
```

Create seed `V2__sample_data.sql` with 2 apartment blocks and 1 standalone house.

### 1.2 Domain Models & JPA Entities (Day 1–2)

**Package:** `com.pms.visualmap.domain`

```
Building.java    — @Entity, fields as per schema
Floor.java       — @Entity, @ManyToOne Building
Unit.java        — @Entity, @ManyToOne Floor, UnitStatus enum
```

### 1.3 Repositories (Day 2)

```java
// Spring Data JPA — no custom queries needed for MVP
BuildingRepository extends JpaRepository<Building, Long>
FloorRepository   extends JpaRepository<Floor, Long>
    List<Floor> findByBuildingIdOrderByFloorNumber(Long buildingId);
UnitRepository    extends JpaRepository<Unit, Long>
    List<Unit> findByFloorId(Long floorId);
```

### 1.4 DTOs & Mappers (Day 2)

Create response DTOs (no Lombok required, use records):

```java
record BuildingDTO(Long id, String name, String address, String type) {}
record FloorDTO(Long id, int floorNumber, String label, int totalUnits, int availableUnits) {}
record UnitDTO(Long id, String unitNumber, int bedrooms, BigDecimal sizeM2,
               BigDecimal monthlyRent, String status, int posX, int posY,
               int widthUnits, int heightUnits) {}
```

### 1.5 Service Layer (Day 3)

```
BuildingService   — getAll(), getById(), create(), delete()
FloorService      — getByBuilding(), create(), delete()
UnitService       — getByFloor(), create(), update(), toggleStatus()
```

### 1.6 REST Controllers (Day 3–4)

```
GET  /api/buildings               → BuildingController
GET  /api/buildings/{id}
GET  /api/buildings/{id}/floors   → includes availableUnits count per floor
GET  /api/floors/{id}/units

POST   /api/admin/buildings       → AdminBuildingController (ROLE_ADMIN)
POST   /api/admin/floors
POST   /api/admin/units
PUT    /api/admin/units/{id}
DELETE /api/admin/units/{id}
PATCH  /api/admin/units/{id}/status
```

### 1.7 Security Config (Day 4)

```java
// SecurityConfig.java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
    .anyRequest().authenticated()
)
```

### 1.8 API Testing with Postman / REST Assured (Day 5)

- Import collection, test all 10 endpoints
- Verify 401 on admin routes without token
- Verify correct unit counts per floor

---

## Phase 2 — Frontend Core

**Goal:** Deliver the interactive floor-selection grid and SVG unit map for public users.

### 2.1 Project Setup (Day 6)

```bash
npm create vite@latest pms-frontend -- --template react-ts
npm install @tanstack/react-query axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure React Query `QueryClientProvider` and React Router `BrowserRouter` in `main.tsx`.

### 2.2 API Service Layer (Day 6)

```
src/api/
  buildingApi.ts    — getBuildings(), getBuilding(id), getBuildingFloors(id)
  floorApi.ts       — getFloorUnits(id)
```

All functions use Axios with a base URL from `VITE_API_BASE_URL` env variable.

### 2.3 Building Overview Page (Day 7)

**Route:** `/buildings/:id`

**Component tree:**
```
BuildingPage
  └── FloorGrid
        └── FloorCard (x N)
              ├── Floor label
              ├── Available count badge
              └── Total unit count
```

- React Query `useQuery(['building-floors', id], () => getBuildingFloors(id))`
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` Tailwind
- FloorCard click → navigate to `/buildings/:buildingId/floors/:floorId`
- Standalone house: if `building.type === 'STANDALONE_HOUSE'`, skip grid, render FloorMapPage directly

### 2.4 Unit SVG Map Component (Day 8–9)

**Route:** `/buildings/:buildingId/floors/:floorId`

```tsx
// UnitMap.tsx — SVG-based grid canvas
const CELL_W = 80; // px per unit column
const CELL_H = 80; // px per unit row

function UnitMap({ units }: { units: UnitDTO[] }) {
  const [selected, setSelected] = useState<UnitDTO | null>(null);
  const gridCols = Math.max(...units.map(u => u.posX + u.widthUnits));
  const gridRows = Math.max(...units.map(u => u.posY + u.heightUnits));

  return (
    <svg
      width={gridCols * CELL_W}
      height={gridRows * CELL_H}
      viewBox={`0 0 ${gridCols * CELL_W} ${gridRows * CELL_H}`}
    >
      {units.map(unit => (
        <UnitCell
          key={unit.id}
          unit={unit}
          isSelected={selected?.id === unit.id}
          onSelect={u => u.status === 'AVAILABLE' && setSelected(u)}
        />
      ))}
    </svg>
  );
}
```

**UnitCell visual states:**

| State     | Fill          | Stroke  | Opacity | Cursor  |
|-----------|---------------|---------|---------|---------|
| Available | `#22C55E`     | `#16A34A` | 1.0   | pointer |
| Occupied  | `#1F2937`     | `#374151` | 0.7   | default |
| Selected  | `#3B82F6`     | `#1D4ED8` | 1.0   | pointer |
| Filtered  | `#D1D5DB`     | `#9CA3AF` | 0.4   | default |

### 2.5 Unit Info Panel (Day 9)

Slide-in drawer (mobile) / positioned tooltip (desktop) showing:
- Unit number, bedrooms, size m², monthly rent
- Status badge
- **Enquire** button (disabled if no unit selected)

### 2.6 Map Legend & Filter Bar (Day 10)

```
FilterBar: Bedrooms (1,2,3,4+) toggle buttons + Max Rent slider
MapLegend: Coloured squares with labels (Available / Occupied / Selected)
```

Filtered units are dimmed using `opacity-40 pointer-events-none` via React state.

---

## Phase 3 — Admin Panel

**Goal:** Allow property managers to create and manage buildings, floors, and units.

### 3.1 Admin Routes & Auth Guard (Day 13)

```tsx
// ProtectedRoute.tsx — checks JWT role claim
<Route path="/admin/*" element={<ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>} />
```

### 3.2 Building Manager (Day 13)

CRUD table for buildings. Form fields: name, address, type (dropdown: Apartment Block / Standalone House).

### 3.3 Floor Editor (Day 14)

- Select building → list floors in order
- Add floor (auto-increments floor number, accepts label)
- Delete floor (confirm dialog)

### 3.4 Unit Editor (Day 14–15)

Visual grid editor:
- Shows a configurable grid (columns × rows)
- Admin clicks a cell to add/edit a unit
- Unit form: unit number, bedrooms, size, rent, position (auto-filled from clicked cell)
- Toggle switch for AVAILABLE / OCCUPIED status
- Live preview of the floor map updates as admin saves

### 3.5 Status Toggle API Integration (Day 15)

```ts
// PATCH /api/admin/units/{id}/status
// Body: { status: 'OCCUPIED' | 'AVAILABLE' }
// React Query invalidateQueries(['floor-units', floorId]) after mutation
```

---

## Phase 4 — Polish & NFRs

**Goal:** Responsive design, accessibility, error states, and performance.

### 4.1 Responsive SVG Map (Day 16)

Wrap SVG in a container with `overflow-x: auto`. On mobile, scale the SVG viewport using a pinch-zoom or a simple zoom control (+/- buttons). Minimum tap target: 44×44px — enforce `CELL_W = CELL_H = 60px` minimum on mobile.

### 4.2 Loading & Error States (Day 16)

- Skeleton loader for FloorGrid and UnitMap while React Query is fetching
- Error boundary with retry button
- Empty state message if a floor has no units configured

### 4.3 Accessibility (Day 17)

- Each SVG `<rect>` gets `role="button"` and `aria-label="Unit 3A, 2 bedrooms, available"`
- Occupied units get `aria-disabled="true"`
- Keyboard navigation: Tab moves between available units; Enter selects

### 4.4 Performance (Day 17)

- React Query stale time set to 60s for unit listings
- SVG elements memoised with `React.memo` keyed by unit ID
- Lazy load `AdminBuildingManager` and `FloorEditor` with `React.lazy` + `Suspense`

### 4.5 End-to-End Testing (Day 18)

Use **Playwright** or **Cypress** for critical paths:
1. Browse building → select floor → click available unit → verify info panel
2. Click occupied unit → verify no interaction
3. Admin login → create building → add floor → add unit → verify appears on public map

---

## Task Breakdown & Estimates

| # | Task | Phase | Est. Days |
|---|------|-------|-----------|
| 1 | DB schema + Flyway migrations | 1 | 0.5 |
| 2 | JPA entities + repositories | 1 | 0.5 |
| 3 | Service layer | 1 | 1.0 |
| 4 | REST controllers (public) | 1 | 1.0 |
| 5 | Security config + JWT | 1 | 0.5 |
| 6 | Admin REST controllers | 1 | 0.5 |
| 7 | Backend unit tests | 1 | 1.0 |
| 8 | Vite + React + TailwindCSS setup | 2 | 0.5 |
| 9 | API service layer (Axios) | 2 | 0.5 |
| 10 | Building overview page + FloorGrid | 2 | 1.0 |
| 11 | SVG UnitMap + UnitCell component | 2 | 2.0 |
| 12 | UnitInfoPanel + Enquire CTA | 2 | 1.0 |
| 13 | FilterBar + MapLegend | 2 | 1.0 |
| 14 | Admin auth guard + routes | 3 | 0.5 |
| 15 | Admin Building Manager (CRUD) | 3 | 1.0 |
| 16 | Floor Editor | 3 | 1.0 |
| 17 | Unit Editor + live preview | 3 | 1.5 |
| 18 | Responsive SVG + mobile UX | 4 | 1.0 |
| 19 | Loading/error/empty states | 4 | 0.5 |
| 20 | Accessibility pass | 4 | 0.5 |
| 21 | Performance optimisations | 4 | 0.5 |
| 22 | E2E tests (Playwright) | 4 | 1.0 |
| **Total** | | | **~18–20 days** |

---

## File & Folder Structure

### Backend (Spring Boot)
```
src/main/java/com/pms/
├── config/
│   ├── SecurityConfig.java
│   └── JwtConfig.java
├── controller/
│   ├── BuildingController.java
│   ├── FloorController.java
│   └── admin/
│       └── AdminBuildingController.java
├── domain/
│   ├── Building.java
│   ├── Floor.java
│   ├── Unit.java
│   └── UnitStatus.java
├── dto/
│   ├── BuildingDTO.java
│   ├── FloorDTO.java
│   └── UnitDTO.java
├── repository/
│   ├── BuildingRepository.java
│   ├── FloorRepository.java
│   └── UnitRepository.java
└── service/
    ├── BuildingService.java
    ├── FloorService.java
    └── UnitService.java

src/main/resources/
├── db/migration/
│   ├── V1__visual_map_schema.sql
│   └── V2__sample_data.sql
└── application.yml
```

### Frontend (React)
```
src/
├── api/
│   ├── buildingApi.ts
│   └── floorApi.ts
├── components/
│   ├── map/
│   │   ├── UnitMap.tsx
│   │   ├── UnitCell.tsx
│   │   ├── UnitInfoPanel.tsx
│   │   ├── FilterBar.tsx
│   │   └── MapLegend.tsx
│   ├── building/
│   │   ├── FloorGrid.tsx
│   │   └── FloorCard.tsx
│   └── admin/
│       ├── AdminBuildingManager.tsx
│       ├── FloorEditor.tsx
│       └── UnitEditor.tsx
├── pages/
│   ├── BuildingPage.tsx
│   ├── FloorMapPage.tsx
│   └── admin/
│       └── AdminDashboard.tsx
├── hooks/
│   ├── useBuilding.ts
│   ├── useFloorUnits.ts
│   └── useUnitMutations.ts
├── types/
│   └── api.types.ts
└── main.tsx
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map rendering | SVG (not Canvas/WebGL) | Accessible, scalable, DOM-friendly; sufficient for ≤200 units/floor |
| State management | React Query + local useState | No global state needed; React Query handles server sync |
| Admin grid editor | CSS Grid + click-to-place | Simpler than drag-and-drop for FYP scope; extensible later |
| Auth | JWT (existing system) | Integrates with existing PMS auth; no new auth system needed |
| Positioning model | (posX, posY, widthUnits, heightUnits) stored in DB | Allows non-uniform unit shapes; maps directly to SVG rect attributes |
| Standalone house | treated as 1-floor building | Minimal schema divergence; same rendering pipeline |

---

## Testing Strategy

### Backend
- **Unit tests** (JUnit 5 + Mockito): Service layer methods
- **Integration tests** (Spring Boot Test + H2 in-memory): Controller endpoints with MockMvc
- **Security tests**: Verify 401/403 responses on admin endpoints

### Frontend
- **Component tests** (Vitest + React Testing Library): UnitCell renders correct colours, FilterBar updates state
- **E2E tests** (Playwright): Full user journeys as described in Acceptance Criteria

---

## Definition of Done

A feature increment is considered **Done** when:

- [ ] All associated FR requirements are implemented and passing
- [ ] Unit and/or integration tests written with ≥70% coverage of new code
- [ ] No console errors or warnings in the browser
- [ ] Feature is responsive on mobile (375px viewport tested)
- [ ] Acceptance criteria from SRS Section 7 pass manually
- [ ] Code reviewed (self-review checklist for FYP)
- [ ] Documentation updated (README or Javadoc where applicable)

---

*End of Implementation Plan — Visual Property Map Feature v1.0*
