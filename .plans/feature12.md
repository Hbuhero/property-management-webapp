# Feature 12 — System issue reporting

Users report platform bugs or support issues; admins triage and update status.

## Goals

- `SystemIssue` entity separate from maintenance (property issues)
- User submit + admin list/update

## Backend steps

1. **Entity**  
   `SystemIssue`: `id`, `reporter` (User), `subject`, `description`, `status` (OPEN, IN_PROGRESS, CLOSED), `severity` optional, `adminNotes` internal optional, timestamps.

2. **Endpoints**  
   - `POST /api/v1/issues` — authenticated user  
   - `GET /api/v1/issues` — user sees own; admin sees all with filters  
   - `PUT /api/v1/issues/{id}` — admin updates status and notes; user might edit only while OPEN (optional)  

3. **Authorization**  
   STRICT: only `ADMIN`/`SUPER_ADMIN` list all; users `GET` only their rows.

4. **Notifications**  
   Optional: notify admin on new issue (Feature 7).

## Frontend steps

1. **Public or app shell**  
   “Report issue” in footer (`SiteFooter`) or profile: form → POST.

2. **Admin**  
   Table on `SystemHealth` or dedicated `admin/issues` route: filters, status dropdown, notes textarea.

3. **Queries**  
   `src/queries/issue.queries.ts`.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/issues` | |
| GET | `/api/v1/issues` | Scoped |
| PUT | `/api/v1/issues/{id}` | Admin |

## Acceptance criteria

- [ ] User creates issue; appears in admin list
- [ ] User B cannot read User A’s issue via ID enumeration (404 or 403)
- [ ] Status updates persist and show in user’s “my tickets” view

## Data model

### Enums

```java
// models/issue/IssueSeverity.java
public enum IssueSeverity {
    LOW,      // cosmetic / minor inconvenience
    MEDIUM,   // functional issue without data loss
    HIGH,     // significant feature broken
    CRITICAL  // data loss, security risk, total outage
}

// models/issue/IssueStatus.java
public enum IssueStatus {
    OPEN,        // new, unassigned
    IN_PROGRESS, // admin acknowledged and working
    RESOLVED,    // fix deployed
    CLOSED,      // confirmed by reporter or auto-closed
    DUPLICATE    // merged into another issue
}

// models/issue/IssueCategory.java
public enum IssueCategory {
    BUG,            // something broken
    FEATURE_REQUEST,// suggestion
    BILLING,        // payment / financial dispute
    ACCESS,         // can't log in / account locked
    PERFORMANCE,    // slowness / timeout
    OTHER
}
```

### Java entity

```java
// models/issue/SystemIssue.java
@Entity
@Table(
    name = "SYSTEM_ISSUES",
    indexes = {
        @Index(name = "idx_issue_reporter",  columnList = "REPORTER_ID"),
        @Index(name = "idx_issue_status",    columnList = "STATUS"),
        @Index(name = "idx_issue_severity",  columnList = "SEVERITY"),
        @Index(name = "idx_issue_category",  columnList = "CATEGORY")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SystemIssue {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REPORTER_ID", nullable = false)
    private User reporter;

    @Column(name = "SUBJECT", nullable = false)
    private String subject;

    @Column(name = "DESCRIPTION", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "CATEGORY", nullable = false)
    private IssueCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "SEVERITY", nullable = false)
    private IssueSeverity severity = IssueSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private IssueStatus status = IssueStatus.OPEN;

    // Admin who is handling it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSIGNED_TO_ID")
    private User assignedTo;

    // Internal notes — never returned to reporter
    @Column(name = "ADMIN_NOTES", columnDefinition = "TEXT")
    private String adminNotes;

    // Public resolution message shown to reporter
    @Column(name = "RESOLUTION_MESSAGE", columnDefinition = "TEXT")
    private String resolutionMessage;

    // For DUPLICATE status — point to canonical issue
    @Column(name = "DUPLICATE_OF_ID")
    private Long duplicateOfId;

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
// src/schemas/issue.schema.ts
import { z } from 'zod';

export const IssueSeveritySchema = z.enum([
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
]);

export const IssueStatusSchema = z.enum([
  'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'DUPLICATE'
]);

export const IssueCategorySchema = z.enum([
  'BUG', 'FEATURE_REQUEST', 'BILLING', 'ACCESS', 'PERFORMANCE', 'OTHER'
]);

export const SystemIssueSchema = z.object({
  id: z.number(),
  reporter: z.object({ id: z.number(), name: z.string() }),
  subject: z.string(),
  description: z.string(),
  category: IssueCategorySchema,
  severity: IssueSeveritySchema,
  status: IssueStatusSchema,
  assignedTo: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  resolutionMessage: z.string().nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // adminNotes intentionally excluded from public schema
});

export const CreateIssueSchema = z.object({
  subject: z.string().min(5).max(120),
  description: z.string().min(20).max(3000),
  category: IssueCategorySchema,
  severity: IssueSeveritySchema.default('MEDIUM'),
});

export const AdminUpdateIssueSchema = z.object({
  status: IssueStatusSchema,
  adminNotes: z.string().optional(),
  resolutionMessage: z.string().optional(),
  assignedToId: z.number().optional(),
  duplicateOfId: z.number().optional(),
});

export type SystemIssue = z.infer<typeof SystemIssueSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F12-01 | Submit issue | Authenticated user | POST with subject + description | 201; status `OPEN` |
| F12-02 | List own | User has issues | GET | Only own rows |
| F12-03 | ID enumeration | User A issue id known to B | B GET by id | 403 or 404; never leak subject/description |
| F12-04 | Admin list | Multiple users’ issues | Admin GET | All visible; filters by status work |
| F12-05 | Admin update | Open issue | PUT status `IN_PROGRESS`, set assignee | Persisted; reporter sees public fields only |
| F12-06 | Resolution | Admin | PUT `RESOLVED` + `resolutionMessage` | Reporter sees message; not `adminNotes` |
| F12-07 | Duplicate | Admin | PUT `DUPLICATE` + `duplicateOfId` | Status correct |
| F12-08 | Validation | — | POST short subject | 400 |
| F12-FE-01 | Footer form | — | Submit from UI | Appears in admin table |
| F12-FE-02 | Reporter view | — | “My tickets” | Shows resolution message when closed |

**SLA note:** track time from `OPEN` to first `IN_PROGRESS` for ops benchmark (manual).

## References

- Frontend: `components/landing/SiteFooter.tsx`, `pages/admin/SystemHealth.tsx`, `router.tsx`
- Depends on: Feature 1
