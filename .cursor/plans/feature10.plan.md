# Feature 10 — Trust and verification

Optional verification workflow: users submit proof; admins approve; “verified” badge in UI.

## Goals

- Persist verification state on user or related table
- APIs: submit, check status, admin approve/deny
- Frontend badge and submission form

## Backend steps

1. **Model choice**  
   - **A:** Add columns on `User`: `verified` boolean, `verificationSubmittedAt`, `verificationReviewNote`.  
   - **B:** `VerificationSubmission` entity with history (preferred if audits matter): `user`, `status` (PENDING, APPROVED, REJECTED), `documentIds`, `reviewedBy`, `reviewedAt`.

2. **Endpoints**  
   - `POST /api/v1/verification/submit` — body: list of document IDs (Feature 8) or embedded upload flow  
   - `GET /api/v1/verification/status` — current user  
   - `GET /api/v1/admin/verifications` — pending queue  
   - `PUT /api/v1/admin/verifications/{userId}/approve`  
   - `PUT /api/v1/admin/verifications/{userId}/reject` — body: reason  

3. **Authorization**  
   Submit: any authenticated user (or only `LANDLORD`/`TENANT` per product). Approve: `ADMIN` only.

4. **Integration**  
   On approve, set `user.verified = true` and optional notification (Feature 7).

## Frontend steps

1. **Profile / settings**  
   Show `verified` badge component; link to submit flow.

2. **Admin**  
   New admin sub-route: verification queue with document preview links.

3. **Queries**  
   `src/queries/verification.queries.ts`.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/verification/submit` | |
| GET | `/api/v1/verification/status` | |
| PUT | `/api/v1/admin/verifications/{userId}/approve` | Admin |

## Acceptance criteria

- [ ] User submits; status `PENDING`; admin approves → `verified` true
- [ ] Rejection stores reason user can read
- [ ] Badge reflects backend state after refetch

## Data model

### Enums

```java
// models/verification/VerificationStatus.java
public enum VerificationStatus {
    PENDING,   // submitted, awaiting admin
    APPROVED,  // admin accepted
    REJECTED   // admin declined (reason stored)
}

// models/verification/VerificationType.java
public enum VerificationType {
    IDENTITY,   // government ID / passport (any user)
    LANDLORD,   // property ownership proof
    CARETAKER   // delegation letter from landlord
}
```

### Java entity

```java
// models/verification/VerificationSubmission.java
@Entity
@Table(
    name = "VERIFICATION_SUBMISSIONS",
    indexes = {
        @Index(name = "idx_verification_user",   columnList = "APPLICANT_ID"),
        @Index(name = "idx_verification_status", columnList = "STATUS")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VerificationSubmission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "APPLICANT_ID", nullable = false)
    private User applicant;

    @Enumerated(EnumType.STRING)
    @Column(name = "VERIFICATION_TYPE", nullable = false)
    private VerificationType verificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private VerificationStatus status = VerificationStatus.PENDING;

    // Comma-separated or JSON array of Document IDs from Feature 8
    @Column(name = "DOCUMENT_IDS", columnDefinition = "TEXT")
    private String documentIds;

    @Column(name = "APPLICANT_NOTES", columnDefinition = "TEXT")
    private String applicantNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REVIEWED_BY_ID")
    private User reviewedBy;

    @Column(name = "REVIEWED_AT")
    private LocalDateTime reviewedAt;

    @Column(name = "REJECTION_REASON", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
```

### User extension (Feature 1)

```java
// Add to models/User.java:
@Column(name = "VERIFIED", nullable = false)
private Boolean verified = false;

// Set to true inside VerificationService.approve():
user.setVerified(true);
userRepository.save(user);
```

### Frontend: Zod schema

```typescript
// src/schemas/verification.schema.ts
import { z } from 'zod';

export const VerificationStatusSchema = z.enum([
  'PENDING', 'APPROVED', 'REJECTED'
]);

export const VerificationTypeSchema = z.enum([
  'IDENTITY', 'LANDLORD', 'CARETAKER'
]);

export const VerificationSubmissionSchema = z.object({
  id: z.number(),
  applicant: z.object({ id: z.number(), name: z.string(), email: z.string() }),
  verificationType: VerificationTypeSchema,
  status: VerificationStatusSchema,
  documentIds: z.array(z.number()).default([]),
  applicantNotes: z.string().nullable().optional(),
  reviewedBy: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  reviewedAt: z.string().datetime().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const SubmitVerificationSchema = z.object({
  verificationType: VerificationTypeSchema,
  documentIds: z.array(z.number()).min(1, 'At least one document required'),
  applicantNotes: z.string().max(500).optional(),
});

export const ReviewVerificationSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),  // required when approved=false
});

export type VerificationSubmission = z.infer<typeof VerificationSubmissionSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F10-01 | Submit | User has ≥1 document id from Feature 8 | POST submit | Row `PENDING`; linked docs listed |
| F10-02 | Resubmit while pending | Existing `PENDING` | POST again | 409 or replaces per spec |
| F10-03 | Status endpoint | Any submission | GET status | Matches DB; includes rejection reason if rejected |
| F10-04 | Admin approve | `PENDING` row | Admin PUT approve | Applicant `verified=true`; submission `APPROVED` |
| F10-05 | Admin reject | Same | PUT reject with reason | `REJECTED`; user can read reason |
| F10-06 | Non-admin queue | `TENANT` | GET admin verifications | 403 |
| F10-07 | Badge | After F10-04 | GET profile / user | `verified` true in API |
| F10-FE-01 | Upload flow | — | User attaches docs and submits | Admin queue shows entry |
| F10-FE-02 | Admin review | — | Approve | User sees verified badge after refresh |

**Audit:** optional check `AuditLog` or admin log for approve/reject actions.

## References

- Depends on: Features 1, 8 (documents), 7 (notifications optional)
