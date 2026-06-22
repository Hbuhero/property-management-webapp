# Feature 6 — Maintenance management

Tenants submit maintenance requests for leased units; property owners (`LAND_LORD`) update status.

**Current state:** Backend has no maintenance module. Frontend has `/tenant/maintenance` → `MaintenancePortal.tsx` (hardcoded mock data only).

## Goals

- `MaintenanceRequest` entity with lifecycle statuses
- `POST` / `GET` / `GET /{id}` / `PUT` scoped by tenant vs owner (reuse `canManage(property, principal)` pattern from `LeaseContractService`)
- Wire tenant portal and add owner queue UI

## Backend steps

Package root: `dev.hud.PropertyManagementSystem`

1. **Models** — `models/maintenance/`
   - Enums: `MaintenanceCategory`, `MaintenancePriority`, `MaintenanceStatus` (see Data model)
   - Entity: `MaintenanceRequest` **extends `BaseEntity`** (soft delete, `uuid`, audit fields — same as `PropertyApplication`, `LeaseContract`)
   - FKs: `User tenant`, `Property property`, **`FloorUnit floorUnit`** (required — matches applications/leases), **`LeaseContract leaseContract`** (optional; set when tenant has `ACCEPTED` contract on that unit)
   - Do **not** link to `Lease` — that entity is a property-level rent template, not tenant tenancy

2. **Payloads** — mirror application module
   - `payloads/requests/maintenance/CreateMaintenanceRequest`, `UpdateMaintenanceRequest`
   - `payloads/responses/maintenance/MaintenanceResponse` with nested `UserSummary`, `PropertySummary`, `UnitSummary` records (copy shape from `ApplicationResponse`)

3. **Repository** — `repositories/maintenance/MaintenanceRequestRepository`
   - Finders: by tenant, by property owner, by status/category/priority, `existsByTenantAndFloorUnitAndStatusIn(...)`

4. **Service** — `services/maintenance/MaintenanceService`
   - **Create (tenant):** `ROLE_TENANT`; require `LeaseContractStatus.ACCEPTED` contract for `floorUnitId`; derive `property` from unit
   - **List:** tenant → own rows; `LAND_LORD` / admin → requests on owned properties (`property.owner.id == principal.id`); admin may filter `tenantId`
   - **Get / update:** same read/manage rules as `ApplicationService` / `LeaseContractService.assertCanManage`
   - **Update (owner/admin):** status transitions, `resolutionNotes`, set `resolvedAt` when status → `RESOLVED` or `CLOSED`
   - **`assignedTo`:** defer — no `CARETAKER` role in `Role` enum today (`SUPER_ADMIN`, `ADMIN`, `USER`, `TENANT`, `LAND_LORD` only)
   - **`imageUrls`:** store JSON string in DB; serialize/deserialize in service (no existing `imageUrls` pattern — follow `User.permissions` TEXT or Gson if needed)

5. **Controller** — `controllers/maintenance/MaintenanceController`
   - `@RequestMapping(Constants.API_V1 + "/maintenance")`
   - `@PreAuthorize("isAuthenticated()")` — same as `ApplicationController`
   - Extract principal via local `requirePrincipal(Authentication)` helper

6. **Endpoints**

   | Method | Path | Who |
   |--------|------|-----|
   | POST | `/api/v1/maintenance` | Tenant |
   | GET | `/api/v1/maintenance` | Scoped list; query: `propertyId`, `floorUnitId`, `status`, `category`, `priority`, `tenantId` (admin) |
   | GET | `/api/v1/maintenance/{id}` | Tenant (own) or owner (property) or admin |
   | PUT | `/api/v1/maintenance/{id}` | Owner / admin |

7. **Events (optional, Feature 7)**
   - `MaintenanceStatusChangedEvent` → notification listener later; no event infra required for F6 MVP

8. **Files to create**

   ```
   models/maintenance/{MaintenanceRequest,MaintenanceCategory,MaintenancePriority,MaintenanceStatus}.java
   repositories/maintenance/MaintenanceRequestRepository.java
   services/maintenance/MaintenanceService.java
   controllers/maintenance/MaintenanceController.java
   payloads/requests/maintenance/{Create,Update}MaintenanceRequest.java
   payloads/responses/maintenance/MaintenanceResponse.java
   ```

## Frontend steps

Follow the **application** module pattern: `schemas/` → `api/` → `queries/` → pages.

1. **Schema** — `src/schemas/maintenance.schema.ts` (see Data model; align field names with `ApplicationSchema` summaries)

2. **API** — `src/api/maintenanceApi.ts`
   - `apiJson` + Zod `.parse()` via `API_V1_PREFIX` from `src/lib/contracts/preVisualMapContracts.ts`

3. **Queries** — `src/queries/maintenance.queries.ts`
   - `maintenanceKeys` factory; `useMaintenanceRequests`, `useMaintenanceRequest`, `useCreateMaintenance`, `useUpdateMaintenance`

4. **Tenant** — refactor `src/pages/tenant/MaintenancePortal.tsx`
   - Replace mock `tickets` array with React Query hooks
   - Create form: `floorUnitId` (from tenant's accepted lease contracts), title, description, category, priority
   - Photos: `uploadListingImage` from `src/api/fileUploadApi.ts`; display via `resolvePropertyImageUrl` from `src/lib/propertyMediaUrl.ts`
   - Status badges from `MaintenanceStatus` enum

5. **Owner** — new `src/pages/owner/MaintenanceQueue.tsx`
   - Route: `${base}/maintenance` under **both** `/owner` and `/landlord` trees in `src/router.tsx` (same pattern as other owner pages)
   - Add nav item in `src/layouts/OwnerLayout.tsx` (Wrench icon)
   - Filter by property/status/priority; inline status update + resolution notes

6. **Tenant overview (optional polish)** — `src/pages/tenant/TenantOverview.tsx` has mock maintenance stats; wire to `useMaintenanceRequests` after portal works

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/maintenance` | Body: `floorUnitId`, `title`, `description`, `category`, `priority`, optional `imageUrls[]`, optional `leaseContractId` |
| GET | `/api/v1/maintenance` | Scoped; filters above |
| GET | `/api/v1/maintenance/{id}` | Single row |
| PUT | `/api/v1/maintenance/{id}` | Body: `status`, optional `resolutionNotes` |

## Acceptance criteria

- [ ] Tenant with `ACCEPTED` `LeaseContract` submits request; appears in owner queue
- [ ] Tenant without active contract on unit gets 403/400
- [ ] Owner moves status through to `RESOLVED`; tenant sees update after refetch
- [ ] Cross-tenant data leakage prevented on list and get-by-id
- [ ] `PropertyStatus.MAINTENANCE` (listing flag) remains unrelated to maintenance tickets

## Data model

### Enums

```java
// models/maintenance/MaintenanceCategory.java
public enum MaintenanceCategory {
    PLUMBING, ELECTRICAL, STRUCTURAL, APPLIANCE,
    PEST, CLEANING, SECURITY, OTHER
}

// models/maintenance/MaintenancePriority.java
public enum MaintenancePriority {
    LOW, MEDIUM, HIGH, URGENT
}

// models/maintenance/MaintenanceStatus.java
public enum MaintenanceStatus {
    SUBMITTED,
    UNDER_REVIEW,
    IN_PROGRESS,
    RESOLVED,
    CLOSED
}
```

### Java entity (sketch)

```java
@Entity(name = "MAINTENANCE_REQUEST")
@Table(indexes = {
    @Index(name = "IDX_MAINT_TENANT", columnList = "TENANT_ID"),
    @Index(name = "IDX_MAINT_PROPERTY", columnList = "PROPERTY_ID"),
    @Index(name = "IDX_MAINT_UNIT", columnList = "FLOOR_UNIT_ID"),
    @Index(name = "IDX_MAINT_STATUS", columnList = "STATUS")
})
public class MaintenanceRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "TENANT_ID", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "PROPERTY_ID", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "FLOOR_UNIT_ID", nullable = false)
    private FloorUnit floorUnit;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "LEASE_CONTRACT_ID")
    private LeaseContract leaseContract;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "DESCRIPTION", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING) @Column(name = "CATEGORY", nullable = false)
    private MaintenanceCategory category;

    @Enumerated(EnumType.STRING) @Column(name = "PRIORITY", nullable = false)
    private MaintenancePriority priority = MaintenancePriority.MEDIUM;

    @Enumerated(EnumType.STRING) @Column(name = "STATUS", nullable = false)
    private MaintenanceStatus status = MaintenanceStatus.SUBMITTED;

    @Column(name = "RESOLUTION_NOTES", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "IMAGE_URLS", columnDefinition = "TEXT")  // JSON array of /file/... paths
    private String imageUrls;

    @Column(name = "RESOLVED_AT")
    private LocalDateTime resolvedAt;
}
```

### Frontend: Zod schema

```typescript
// src/schemas/maintenance.schema.ts
import { z } from 'zod';

export const MaintenanceCategorySchema = z.enum([
  'PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'APPLIANCE',
  'PEST', 'CLEANING', 'SECURITY', 'OTHER',
]);

export const MaintenancePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const MaintenanceStatusSchema = z.enum([
  'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED',
]);

const UserSummarySchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
});

const PropertySummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ownerId: z.number().nullable().optional(),
});

const UnitSummarySchema = z.object({
  id: z.number(),
  floorId: z.number().nullable().optional(),
  floorLabel: z.string().nullable().optional(),
  unitNumber: z.string(),
});

export const MaintenanceRequestSchema = z.object({
  id: z.number(),
  tenant: UserSummarySchema,
  property: PropertySummarySchema,
  unit: UnitSummarySchema,
  leaseContractId: z.number().nullable().optional(),
  title: z.string(),
  description: z.string(),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema,
  status: MaintenanceStatusSchema,
  resolutionNotes: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).default([]),
  resolvedAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const CreateMaintenanceSchema = z.object({
  floorUnitId: z.number(),
  leaseContractId: z.number().optional(),
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema.default('MEDIUM'),
  imageUrls: z.array(z.string()).max(5).default([]),
});

export const UpdateMaintenanceSchema = z.object({
  status: MaintenanceStatusSchema,
  resolutionNotes: z.string().max(2000).optional(),
});
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F6-01 | Submit request | Tenant with `ACCEPTED` `LeaseContract` on unit | POST maintenance | 201; status `SUBMITTED` |
| F6-02 | No contract | Tenant not leasing unit | POST | 403 or 400 |
| F6-03 | Tenant list | Several requests | GET as tenant | Only own rows |
| F6-04 | Owner queue | Request on owned property | GET as `LAND_LORD` | Row visible |
| F6-05 | Status progression | Owner | PUT `UNDER_REVIEW` → `IN_PROGRESS` → `RESOLVED` | Each persists |
| F6-06 | Foreign update | Wrong landlord | PUT status | 403 |
| F6-07 | Filter priority | Owner | GET `?priority=URGENT` | Correct subset |
| F6-08 | Get by id | Tenant | GET `/{id}` own vs other's | 200 vs 403 |
| F6-FE-01 | Portal form | Tenant | Submit via UI | Appears in list with badge |
| F6-FE-02 | Owner board | Landlord | Change status | Tenant UI shows update after refetch |

**Leak test:** tenant A must never see tenant B's request text in list or by id.

## References

**Backend (patterns to copy):**
- `controllers/application/ApplicationController.java`
- `services/application/ApplicationService.java`
- `services/lease/LeaseContractService.java` (`canManage`, `assertTenant`)
- `payloads/responses/application/ApplicationResponse.java`
- `models/application/PropertyApplication.java`

**Frontend:**
- `src/pages/tenant/MaintenancePortal.tsx` (replace mock)
- `src/api/applicationApi.ts`, `src/queries/application.queries.ts`
- `src/router.tsx`, `src/layouts/OwnerLayout.tsx`, `src/layouts/TenantLayout.tsx`
- `src/api/fileUploadApi.ts`, `src/lib/propertyMediaUrl.ts`

**Depends on:** Features 1–2 (properties/units), Feature 3 (`LeaseContract` with `ACCEPTED` status). Feature 7 notifications optional follow-up.
