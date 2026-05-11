# Feature 4 — Lease management

Formal lease record after (or alongside) approved application; scheduled checks for upcoming expiry.

## Goals

- `Lease` entity: tenant, property, dates, terms
- CRUD/read APIs with authorization
- Scheduler creates notifications (Feature 7) for expiring leases

## Backend steps

1. **Entity**  
   `Lease`: `id`, `tenant`, `property`, `startDate`, `endDate`, `terms` (TEXT), `monthlyRent` optional snapshot, `status` (ACTIVE, ENDED), FK to optional `application` for traceability.

2. **Business rules**  
   - Create lease only if tenant has `APPROVED` application for that property (or admin override).  
   - One `ACTIVE` lease per property (typical) — enforce in service.

3. **Endpoints**  
   - `POST /api/v1/leases`  
   - `GET /api/v1/leases` — filter by `tenantId`, `propertyId`, `ownerId` (derived), pagination  
   - `GET /api/v1/leases/{id}`  
   - `PUT /api/v1/leases/{id}` — limited fields if needed  

4. **Scheduler**  
   `@Scheduled(cron = ...)` daily: find leases where `endDate` within N days; insert notifications or emit `LeaseExpiringEvent`. Use `@EnableScheduling` (Feature 0).

## Frontend steps

1. **Queries**  
   `src/queries/lease.queries.ts` for list and detail.

2. **Tenant**  
   `pages/tenant/LeaseManagement.tsx`: show active lease, dates, terms PDF link (Feature 8 later).

3. **Owner**  
   Page or section under owner layout: list leases for owned properties; create lease from approved application (wizard).

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/leases` | Owner/Admin creates |
| GET | `/api/v1/leases` | Scoped |
| GET | `/api/v1/leases/{id}` | Tenant/owner/admin as applicable |

## Acceptance criteria

- [ ] Lease created and visible to tenant and property owner
- [ ] Scheduler runs (in dev, use short fixed delay for testing) and triggers notification rows or logs
- [ ] Cannot create second active lease for same property if rule enabled

## Data model

### Enum

```java
// models/lease/LeaseStatus.java
public enum LeaseStatus {
    ACTIVE,           // currently running
    EXPIRED,          // end date passed, not renewed
    TERMINATED,       // ended early
    PENDING_RENEWAL   // expiry approaching, renewal initiated
}
```

### Java entity

```java
// models/lease/Lease.java
@Entity
@Table(
    name = "LEASES",
    indexes = {
        @Index(name = "idx_lease_tenant",   columnList = "TENANT_ID"),
        @Index(name = "idx_lease_property", columnList = "PROPERTY_ID"),
        @Index(name = "idx_lease_status",   columnList = "STATUS"),
        @Index(name = "idx_lease_end_date", columnList = "END_DATE")  // for scheduler
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Lease {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TENANT_ID", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROPERTY_ID", nullable = false)
    private Property property;

    // Traceability: which application led to this lease
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "APPLICATION_ID")
    private Application application;

    @Column(name = "START_DATE", nullable = false)
    private LocalDate startDate;

    @Column(name = "END_DATE", nullable = false)
    private LocalDate endDate;

    // Snapshot of rent at lease creation — immune to property edits
    @Column(name = "MONTHLY_RENT", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "CURRENCY", length = 3, nullable = false)
    private String currency = "TZS";

    // Day of month rent is due (1–28)
    @Column(name = "PAYMENT_DAY_OF_MONTH", nullable = false)
    private Integer paymentDayOfMonth = 1;

    @Column(name = "TERMS", columnDefinition = "TEXT")
    private String terms;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private LeaseStatus status = LeaseStatus.ACTIVE;

    @Column(name = "RENEWAL_REQUESTED", nullable = false)
    private Boolean renewalRequested = false;

    @Column(name = "TERMINATED_AT")
    private LocalDateTime terminatedAt;

    @Column(name = "TERMINATION_REASON", columnDefinition = "TEXT")
    private String terminationReason;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
```

### Scheduler note

```java
// jobs/LeaseExpiryJob.java — runs daily at 08:00 EAT
@Scheduled(cron = "0 0 8 * * *", zone = "Africa/Dar_es_Salaam")
public void checkExpiringLeases() {
    LocalDate warningDate = LocalDate.now().plusDays(30);
    List<Lease> expiring = leaseRepository
        .findByStatusAndEndDateBefore(LeaseStatus.ACTIVE, warningDate);
    expiring.forEach(eventPublisher::publishLeaseExpiringEvent);
}
```

### Frontend: Zod schema

```typescript
// src/schemas/lease.schema.ts
import { z } from 'zod';

export const LeaseStatusSchema = z.enum([
  'ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING_RENEWAL'
]);

export const LeaseSchema = z.object({
  id: z.number(),
  tenant: z.object({ id: z.number(), name: z.string(), email: z.string() }),
  property: z.object({
    id: z.number(), title: z.string(), location: z.string(), address: z.string().optional()
  }),
  application: z.object({ id: z.number() }).nullable().optional(),
  startDate: z.string(),        // "YYYY-MM-DD"
  endDate: z.string(),
  monthlyRent: z.number(),
  currency: z.string(),
  paymentDayOfMonth: z.number().int().min(1).max(28),
  terms: z.string().optional(),
  status: LeaseStatusSchema,
  renewalRequested: z.boolean(),
  terminatedAt: z.string().datetime().nullable().optional(),
  terminationReason: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateLeaseSchema = z.object({
  tenantId: z.number(),
  propertyId: z.number(),
  applicationId: z.number().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlyRent: z.number().positive().optional(), // defaults to property rent
  paymentDayOfMonth: z.number().int().min(1).max(28).default(1),
  terms: z.string().optional(),
});

export type Lease = z.infer<typeof LeaseSchema>;
export type CreateLease = z.infer<typeof CreateLeaseSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F4-01 | Create lease | Approved application (or admin bypass) for property + tenant | POST lease with dates, rent | 201; `status` ACTIVE; property may flip to `RENTED` per rule |
| F4-02 | Second active lease | Property already has `ACTIVE` lease | POST another overlapping | 409 or 400 |
| F4-03 | Date validation | — | `endDate` before `startDate` | 400 |
| F4-04 | Tenant read | User is lease tenant | GET by id | 200 |
| F4-05 | Owner read | User owns property | GET list filtered | Includes lease row |
| F4-06 | Foreign read | User neither tenant nor owner | GET by id | 403 or 404 |
| F4-07 | Terminate | Owner or admin | PUT terminate with reason | Status `TERMINATED`; timestamps set |
| F4-08 | Scheduler / expiry job | Lease ends in X days (configure test clock or seed date) | Run/wait for scheduled job | Notification or event emitted (Feature 7); log shows run (no exception) |
| F4-FE-01 | Tenant lease page | Active lease | Open lease management | Dates, rent, terms match API |
| F4-FE-02 | Owner create flow | Approved application | Wizard completes | New lease appears in lists |

**Clock tip:** use leases with `endDate = today + 30` and job threshold 30 days to hit F4-08 in dev.

## References

- Frontend: `pages/tenant/LeaseManagement.tsx`
- Depends on: Features 1–3
