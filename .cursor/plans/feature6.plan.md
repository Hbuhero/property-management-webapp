# Feature 6 — Maintenance management

Tenants submit maintenance requests; property owners or staff update status.

## Goals

- `MaintenanceRequest` with lifecycle statuses
- POST/GET/PUT with tenant vs owner scoping

## Backend steps

1. **Entity**  
   `MaintenanceRequest`: `id`, `tenant`, `property`, `title` or single `description`, `status` (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`), optional `resolutionNotes`, timestamps.

2. **Authorization**  
   - Tenant creates for properties they lease (active lease) or any rented unit per your rule set.  
   - Owner sees requests for owned properties.  
   - Tenant sees own requests.

3. **Endpoints**  
   - `POST /api/v1/maintenance`  
   - `GET /api/v1/maintenance` — filters: `propertyId`, `status`, `tenantId` (admin)  
   - `PUT /api/v1/maintenance/{id}` — owner/caretaker updates status and notes  

4. **Events**  
   Optional: `MaintenanceStatusChangedEvent` for notifications (Feature 7).

## Frontend steps

1. **Queries**  
   `src/queries/maintenance.queries.ts`.

2. **Tenant**  
   `pages/tenant/MaintenancePortal.tsx`: form + list with status badges.

3. **Owner**  
   New route e.g. `/owner/maintenance` or section in dashboard: queue with filters, inline status update.

4. **Router**  
   Add lazy route under `OwnerLayout` if new page.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/maintenance` | Tenant |
| GET | `/api/v1/maintenance` | Scoped |
| PUT | `/api/v1/maintenance/{id}` | Owner/Caretaker/Admin |

## Acceptance criteria

- [ ] Tenant submits request; appears in owner queue
- [ ] Owner moves status to `RESOLVED`; tenant sees update
- [ ] Cross-tenant data leakage prevented on list endpoints

## Data model

### Enums

```java
// models/maintenance/MaintenanceCategory.java
public enum MaintenanceCategory {
    PLUMBING,    // leaks, pipes, drainage
    ELECTRICAL,  // wiring, outlets, lighting
    STRUCTURAL,  // walls, roof, doors, windows
    APPLIANCE,   // fridge, AC, stove
    PEST,        // pest control
    CLEANING,    // deep cleaning, waste
    SECURITY,    // locks, gates, CCTV
    OTHER
}

// models/maintenance/MaintenancePriority.java
public enum MaintenancePriority {
    LOW,    // cosmetic / non-urgent
    MEDIUM, // noticeable, fix within a week
    HIGH,   // affects daily living
    URGENT  // safety risk / no water / no electricity
}

// models/maintenance/MaintenanceStatus.java
public enum MaintenanceStatus {
    SUBMITTED,    // tenant just filed
    UNDER_REVIEW, // owner/caretaker acknowledged
    IN_PROGRESS,  // work started
    RESOLVED,     // work done; tenant may confirm
    CLOSED        // completed and confirmed / cancelled
}
```

### Java entity

```java
// models/maintenance/MaintenanceRequest.java
@Entity
@Table(
    name = "MAINTENANCE_REQUESTS",
    indexes = {
        @Index(name = "idx_maint_tenant",   columnList = "TENANT_ID"),
        @Index(name = "idx_maint_property", columnList = "PROPERTY_ID"),
        @Index(name = "idx_maint_status",   columnList = "STATUS"),
        @Index(name = "idx_maint_priority", columnList = "PRIORITY")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MaintenanceRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TENANT_ID", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROPERTY_ID", nullable = false)
    private Property property;

    // Optional: link to the active lease for financial correlation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LEASE_ID")
    private Lease lease;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "DESCRIPTION", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "CATEGORY", nullable = false)
    private MaintenanceCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "PRIORITY", nullable = false)
    private MaintenancePriority priority = MaintenancePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private MaintenanceStatus status = MaintenanceStatus.SUBMITTED;

    // Caretaker or external contractor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSIGNED_TO")
    private User assignedTo;

    @Column(name = "RESOLUTION_NOTES", columnDefinition = "TEXT")
    private String resolutionNotes;

    // JSON array of uploaded photo paths (from FileService)
    @Column(name = "IMAGE_URLS", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "RESOLVED_AT")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
```

### Frontend: Zod schema

```typescript
// src/schemas/maintenance.schema.ts
import { z } from 'zod';

export const MaintenanceCategorySchema = z.enum([
  'PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'APPLIANCE',
  'PEST', 'CLEANING', 'SECURITY', 'OTHER'
]);

export const MaintenancePrioritySchema = z.enum([
  'LOW', 'MEDIUM', 'HIGH', 'URGENT'
]);

export const MaintenanceStatusSchema = z.enum([
  'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
]);

export const MaintenanceRequestSchema = z.object({
  id: z.number(),
  tenant: z.object({ id: z.number(), name: z.string(), phoneNumber: z.string().optional() }),
  property: z.object({ id: z.number(), title: z.string(), address: z.string().optional() }),
  lease: z.object({ id: z.number() }).nullable().optional(),
  title: z.string(),
  description: z.string(),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema,
  status: MaintenanceStatusSchema,
  assignedTo: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).default([]),
  resolvedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateMaintenanceSchema = z.object({
  propertyId: z.number(),
  leaseId: z.number().optional(),
  title: z.string().min(5, 'Please provide a brief title').max(120),
  description: z.string().min(10, 'Please describe the issue').max(2000),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema.default('MEDIUM'),
  imageUrls: z.array(z.string()).max(5).default([]),
});

export const UpdateMaintenanceSchema = z.object({
  status: MaintenanceStatusSchema,
  assignedToId: z.number().optional(),
  resolutionNotes: z.string().optional(),
});

export type MaintenanceRequest = z.infer<typeof MaintenanceRequestSchema>;
export type CreateMaintenance = z.infer<typeof CreateMaintenanceSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F6-01 | Submit request | Tenant with `ACTIVE` lease on property | POST maintenance | 201; status `SUBMITTED` |
| F6-02 | No lease | Tenant not leasing property | POST | 403 or 400 per rule |
| F6-03 | Tenant list | Several requests | GET as tenant | Only own rows |
| F6-04 | Owner queue | Request on owned property | GET as landlord | Row visible |
| F6-05 | Status progression | Owner | PUT `UNDER_REVIEW` → `IN_PROGRESS` → `RESOLVED` | Each persists; optional notification |
| F6-06 | Foreign update | Wrong landlord | PUT status | 403 |
| F6-07 | Assign caretaker | CARETAKER user | PUT `assignedTo` | Only if authorised; tenant sees assignee |
| F6-08 | Priority / category | — | Filter GET by `priority` | Correct subset |
| F6-FE-01 | Portal form | Tenant | Submit | Appears in list with badge |
| F6-FE-02 | Owner board | Landlord | Change status | Tenant UI shows update after refetch |

**Leak test:** tenant A must never see tenant B’s request text in list or by id.

## References

- Frontend: `pages/tenant/MaintenancePortal.tsx`, `router.tsx`, `layouts/OwnerLayout.tsx`
- Depends on: Features 1–2, lease linkage optional but recommended
