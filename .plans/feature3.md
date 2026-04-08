# Feature 3 — Tenant onboarding and applications

Tenants apply to rent a property; landlords (or caretakers/admins) approve or reject.

## Goals

- `Application` entity linking `tenant` (User), `property`, `status`
- Role-scoped listing and explicit approve/reject actions
- UI: apply from property detail; inbox for owners; status for tenants

## Backend steps

1. **Entity**  
   `Application`: `id`, `tenant` (User), `property` (Property), `status` enum `PENDING`, `APPROVED`, `REJECTED`, `message` optional, timestamps. Unique constraint optional: one `PENDING` per `(tenant_id, property_id)`.

2. **Service rules**  
   - Only `TENANT` (or role allowing apply) creates application for `AVAILABLE` property.  
   - Owner of property approves/rejects (or `CARETAKER`/`ADMIN` if you extend rules).  
   - Optionally auto-reject other pending apps on same property when one is approved (product decision).

3. **Endpoints**  
   - `POST /api/v1/applications` — body: `propertyId`, optional note  
   - `GET /api/v1/applications` — tenant sees own; owner sees apps for their properties; admin sees all (query params)  
   - `PUT /api/v1/applications/{id}/approve`  
   - `PUT /api/v1/applications/{id}/reject` — body optional reason  

4. **Events (for Feature 7)**  
   Publish `ApplicationApprovedEvent` / `ApplicationRejectedEvent` after status change.

## Frontend steps

1. **Queries**  
   `src/queries/application.queries.ts`: list, create, approve, reject; keys factory pattern like `propertyKeys`.

2. **Property detail**  
   “Apply” button if user is tenant and property available; disable if pending application exists.

3. **Tenant dashboard**  
   Show application status cards (reuse `TenantOverview` or new section).

4. **Owner inbox**  
   Wire `pages/owner/ApplicationInbox.tsx` to list + approve/reject with confirmation.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/applications` | Tenant |
| GET | `/api/v1/applications` | Scoped by role |
| PUT | `/api/v1/applications/{id}/approve` | Owner/Admin |
| PUT | `/api/v1/applications/{id}/reject` | Owner/Admin |

## Acceptance criteria

- [ ] Tenant submits application; appears in owner inbox as `PENDING`
- [ ] Owner approves; status updates; tenant sees `APPROVED`
- [ ] Double-submit prevention or clear error for duplicate pending application

## Data model

### Enum

```java
// models/application/ApplicationStatus.java
public enum ApplicationStatus {
    PENDING,    // submitted, awaiting review
    APPROVED,   // owner accepted this tenant
    REJECTED,   // owner declined
    WITHDRAWN   // tenant cancelled before decision
}
```

### Java entity

```java
// models/application/Application.java
@Entity
@Table(
    name = "APPLICATIONS",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_application_tenant_property_active",
        columnNames = {"TENANT_ID", "PROPERTY_ID"}
        // Enforced at service level: one non-REJECTED, non-WITHDRAWN per pair
    ),
    indexes = {
        @Index(name = "idx_application_tenant",   columnList = "TENANT_ID"),
        @Index(name = "idx_application_property", columnList = "PROPERTY_ID"),
        @Index(name = "idx_application_status",   columnList = "STATUS")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Application {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TENANT_ID", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROPERTY_ID", nullable = false)
    private Property property;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    // Tenant writes: "Hi, I'm looking for a quiet place..."
    @Column(name = "COVER_NOTE", columnDefinition = "TEXT")
    private String coverNote;

    // Owner writes when rejecting
    @Column(name = "REJECTION_REASON", columnDefinition = "TEXT")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REVIEWED_BY")
    private User reviewedBy;

    @Column(name = "REVIEWED_AT")
    private LocalDateTime reviewedAt;

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
// src/schemas/application.schema.ts
import { z } from 'zod';

export const ApplicationStatusSchema = z.enum([
  'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'
]);

export const ApplicationSchema = z.object({
  id: z.number(),
  tenant: z.object({ id: z.number(), name: z.string(), email: z.string() }),
  property: z.object({
    id: z.number(),
    title: z.string(),
    location: z.string(),
    monthlyRent: z.number(),
    currency: z.string(),
  }),
  status: ApplicationStatusSchema,
  coverNote: z.string().optional(),
  rejectionReason: z.string().nullable().optional(),
  reviewedBy: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  reviewedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateApplicationSchema = z.object({
  propertyId: z.number(),
  coverNote: z.string().max(1000).optional(),
});

export const RejectApplicationSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type CreateApplication = z.infer<typeof CreateApplicationSchema>;
```

### Response DTO (backend)

```java
// payloads/responses/application/ApplicationResponse.java
public class ApplicationResponse {
    Long id;
    TenantSummary tenant;     // { id, name, email, phoneNumber, verified }
    PropertySummary property; // { id, title, location, monthlyRent, currency }
    String status;
    String coverNote;
    String rejectionReason;
    UserSummary reviewedBy;
    LocalDateTime reviewedAt;
    LocalDateTime createdAt;
}
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F3-01 | Submit application | `TENANT`, property `AVAILABLE` | POST `propertyId` + optional note | 201; status `PENDING` |
| F3-02 | Duplicate pending | Same tenant + property already `PENDING` | POST again | 409 or 400; no second pending row |
| F3-03 | Wrong property state | Property `RENTED` or `DRAFT` | POST apply | 400 with business reason |
| F3-04 | Non-tenant apply | `LANDLORD` tries apply | POST | 403 |
| F3-05 | Tenant list | Applications exist for tenant | GET as tenant | Only own applications; property summary present |
| F3-06 | Owner inbox | Pending app on owner’s property | GET as owner | Application visible; not other owners’ apps |
| F3-07 | Approve | Owner of property, app `PENDING` | PUT approve | Status `APPROVED`; timestamp/reviewer set; event for notifications if enabled |
| F3-08 | Reject | Same | PUT reject with reason | Status `REJECTED`; reason stored |
| F3-09 | Foreign approve | User B not owner | PUT approve | 403 |
| F3-10 | Withdraw | Tenant, own `PENDING` | PUT withdraw (if API exists) or DELETE | Status `WITHDRAWN`; owner no longer sees as pending |
| F3-FE-01 | Property detail | Tenant logged in | Click apply | Success toast; button disabled if pending |
| F3-FE-02 | Inbox actions | Owner | Approve / reject | UI updates; tenant sees new status after refresh |

**Ordering:** run F3-01 before F3-07; re-seed DB if testing reject path on same row.

## References

- Frontend: `pages/owner/ApplicationInbox.tsx`, `pages/PropertyDetail.tsx`, `pages/tenant/TenantOverview.tsx`
- Depends on: Feature 1 (auth), Feature 2 (properties)
