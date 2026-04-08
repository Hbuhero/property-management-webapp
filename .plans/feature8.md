# Feature 8 — Document management

Metadata for uploaded files (leases, IDs) with RBAC; reuse existing file storage.

## Goals

- `Document` record: owner user, type, storage key/URL, optional link to lease/property/user
- Upload flow: file → existing `FileController` → save metadata
- Download/list restricted by role

## Backend steps

1. **Entity**  
   `Document`: `id`, `uploadedBy` (User), `fileName`, `storagePath` or URL, `documentType` (LEASE, ID, RECEIPT, OTHER), optional `relatedEntityType` + `relatedEntityId`, `createdAt`.

2. **Service**  
   After multipart upload via `FileService`, create `Document` row. Alternatively single endpoint that accepts upload + metadata together.

3. **Authorization**  
   - User can read own documents.  
   - Owner can read documents tied to their properties/leases.  
   - Admin broad read.  
   Enforce in service layer before streaming bytes.

4. **Endpoints**  
   - `POST /api/v1/documents` — multipart or JSON after separate file upload  
   - `GET /api/v1/documents` — list with filters  
   - `GET /api/v1/documents/{id}/download` — binary or redirect  

5. **Storage abstraction**  
   Keep local path behind interface for future S3 (`FileService` refactor optional).

## Frontend steps

1. **Reuse**  
   `components/file-upload.tsx` to upload; then POST metadata or use combined endpoint.

2. **Queries**  
   `src/queries/document.queries.ts`.

3. **Viewer**  
   PDF/image preview where safe; otherwise download link.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/documents` | Metadata + file reference |
| GET | `/api/v1/documents` | List |
| GET | `/api/v1/documents/{id}/download` | Authorized |

## Acceptance criteria

- [ ] Tenant uploads lease-related doc; visible to tenant and property owner
- [ ] Another tenant cannot download document
- [ ] File stored consistently with existing upload directory config

## Data model

### Enum

```java
// models/document/DocumentType.java
public enum DocumentType {
    LEASE_AGREEMENT,     // signed lease PDF
    NATIONAL_ID,         // government ID
    PASSPORT,
    PROOF_OF_INCOME,     // pay-slip, bank statement
    PROPERTY_TITLE,      // ownership documents for landlord verification
    INSPECTION_REPORT,   // property condition report
    PAYMENT_RECEIPT,     // manual payment proof
    MAINTENANCE_PHOTO,   // photo attached to a request
    OTHER
}
```

### Java entity

```java
// models/document/Document.java
@Entity
@Table(
    name = "DOCUMENTS",
    indexes = {
        @Index(name = "idx_doc_uploader",     columnList = "UPLOADED_BY_ID"),
        @Index(name = "idx_doc_entity",       columnList = "RELATED_ENTITY_TYPE, RELATED_ENTITY_ID"),
        @Index(name = "idx_doc_type",         columnList = "DOCUMENT_TYPE")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Document {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UPLOADED_BY_ID", nullable = false)
    private User uploadedBy;

    // Original file name from browser
    @Column(name = "ORIGINAL_FILE_NAME", nullable = false)
    private String originalFileName;

    // Stored file name / key on disk or in S3
    @Column(name = "STORAGE_KEY", nullable = false)
    private String storageKey;

    // MIME type e.g. "application/pdf", "image/jpeg"
    @Column(name = "CONTENT_TYPE", nullable = false)
    private String contentType;

    @Column(name = "FILE_SIZE_BYTES")
    private Long fileSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "DOCUMENT_TYPE", nullable = false)
    private DocumentType documentType;

    // Polymorphic association (no FK constraint — for flexibility)
    @Column(name = "RELATED_ENTITY_TYPE")
    private String relatedEntityType;   // "LEASE", "APPLICATION", "USER", etc.

    @Column(name = "RELATED_ENTITY_ID")
    private Long relatedEntityId;

    // True for things like property photos visible in marketplace
    @Column(name = "IS_PUBLIC", nullable = false)
    private Boolean isPublic = false;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;
}
```

### Frontend: Zod schema

```typescript
// src/schemas/document.schema.ts
import { z } from 'zod';

export const DocumentTypeSchema = z.enum([
  'LEASE_AGREEMENT', 'NATIONAL_ID', 'PASSPORT', 'PROOF_OF_INCOME',
  'PROPERTY_TITLE', 'INSPECTION_REPORT', 'PAYMENT_RECEIPT',
  'MAINTENANCE_PHOTO', 'OTHER'
]);

export const DocumentSchema = z.object({
  id: z.number(),
  uploadedBy: z.object({ id: z.number(), name: z.string() }),
  originalFileName: z.string(),
  contentType: z.string(),
  fileSizeBytes: z.number().nullable().optional(),
  documentType: DocumentTypeSchema,
  relatedEntityType: z.string().nullable().optional(),
  relatedEntityId: z.number().nullable().optional(),
  isPublic: z.boolean(),
  downloadUrl: z.string(),   // resolved by backend at query time
  createdAt: z.string().datetime(),
});

export const UploadDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.number().optional(),
  isPublic: z.boolean().default(false),
  // file itself comes as multipart; this is the metadata
});

export type Document = z.infer<typeof DocumentSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F8-01 | Upload + metadata | Authenticated user | Upload file then POST metadata (or combined endpoint) | Document row; `storageKey` resolvable |
| F8-02 | Download own | User uploaded | GET download | 200; bytes match upload |
| F8-03 | Download denied | User B not entitled | GET download User A’s private doc | 403 or 404 |
| F8-04 | Related entity | `relatedEntityType=LEASE`, valid id | POST | FK logic or polymorphic id accepted |
| F8-05 | Public flag | `isPublic=true` | Unauthenticated GET if policy allows | Or still 401 if all docs require auth |
| F8-06 | Landlord read tenant doc | Doc linked to lease on owner’s property | Owner GET | Allowed per RBAC |
| F8-07 | List filter | Multiple types | GET `documentType=...` | Correct subset |
| F8-08 | Large file | Config max size | Upload oversized | 413 or 400; no orphan DB row |
| F8-FE-01 | Upload UI | — | Use file component | Progress + success; appears in list |

**Integrity:** delete user; documents either cascade or block with clear admin error (document expected behaviour).

## References

- Backend: `controllers/FileController.java`, `services/FileService.java`
- Frontend: `components/file-upload.tsx`
- Depends on: Feature 1; Feature 4 for lease-linked docs
