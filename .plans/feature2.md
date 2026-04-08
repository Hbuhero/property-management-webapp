# Feature 2 — Property management

CRUD for properties owned by landlords; public/searchable listing for tenants and marketplace.

## Goals

- `Property` entity with `owner` → `User` (many-to-one)
- REST under `/api/v1/properties` with filtering
- Frontend: marketplace + detail + owner inventory backed by API

## Backend steps

1. **Package layout** (example)  
   `property/Property.java`, `PropertyRepository.java`, `PropertyService.java`, `PropertyController.java`, DTOs under `payloads/requests|responses/property/`.

2. **Entity**  
   Fields aligned with spec: `title`, `description`, `rent` (BigDecimal), `location`, `status` (e.g. DRAFT, AVAILABLE, RENTED), `owner` FK, optional `bedrooms`, `bathrooms`, image keys or URLs. Use `@CreatedDate` / audit if desired.

3. **Authorization**  
   - `GET /properties`, `GET /properties/{id}`: authenticated or public read (product decision; marketplace may allow anonymous read with limited fields).  
   - `POST`, `PUT`, `DELETE`: owner must match `owner_id` or `ADMIN`.

4. **Endpoints**  
   - `POST /api/v1/properties`  
   - `GET /api/v1/properties` — query params: `location`, `minRent`, `maxRent`, `status`, pagination  
   - `GET /api/v1/properties/{id}`  
   - `PUT /api/v1/properties/{id}`  
   - `DELETE /api/v1/properties/{id}` — soft delete or restrict if active lease exists (business rule)

5. **Validation**  
   DTOs with `@NotBlank`, `@Positive` for rent; return 400 with clear messages.

## Frontend steps

1. **Schemas**  
   Align `src/schemas/property.schema.ts` with API (`id` type: string vs number — pick one and convert in mappers).

2. **Queries**  
   Implement `fetchProperties`, `fetchProperty`, `createProperty`, `updateProperty` in `src/queries/property.queries.ts` using `apiClient`.

3. **Marketplace**  
   Replace hardcoded arrays in `pages/MarketPlace.tsx` with `useProperties(filters)`.

4. **Property detail**  
   `pages/PropertyDetail.tsx`: load by route param id; show owner actions only if current user owns property.

5. **Owner inventory**  
   `pages/owner/PropertyInventory.tsx`: list owned properties, create/edit forms, link to applications (Feature 3).

## API sketch

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/properties` | Optional/spec-dependent |
| GET | `/api/v1/properties/{id}` | Optional/spec-dependent |
| POST | `/api/v1/properties` | Landlord / Admin |
| PUT | `/api/v1/properties/{id}` | Owner or Admin |
| DELETE | `/api/v1/properties/{id}` | Owner or Admin |

## Acceptance criteria

- [ ] Landlord creates property and sees it in `GET` list scoped or filterable by owner
- [ ] Tenant sees properties on marketplace with filters
- [ ] Unauthorized user cannot mutate another user’s property

## Data model

### Enums

```java
// models/property/PropertyType.java
public enum PropertyType {
    APARTMENT,   // flat in a multi-unit building
    HOUSE,       // standalone residential
    STUDIO,      // single-room with kitchenette
    COMMERCIAL,  // offices, shops
    LAND         // undeveloped plot
}

// models/property/PropertyStatus.java
public enum PropertyStatus {
    DRAFT,       // saved but not visible on marketplace
    AVAILABLE,   // visible, accepting applications
    RENTED,      // active lease; hidden from applications
    MAINTENANCE, // temporarily unavailable
    ARCHIVED     // soft-deleted / no longer listed
}
```

### Java entity

```java
// models/property/Property.java
@Entity
@Table(
    name = "PROPERTIES",
    indexes = {
        @Index(name = "idx_property_owner",  columnList = "OWNER_ID"),
        @Index(name = "idx_property_status", columnList = "STATUS"),
        @Index(name = "idx_property_region", columnList = "REGION")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Property {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    // Owner — LANDLORD or CARETAKER acting on behalf of landlord
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OWNER_ID", nullable = false)
    private User owner;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    @Column(name = "MONTHLY_RENT", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "CURRENCY", length = 3, nullable = false)
    private String currency = "TZS";

    @Column(name = "LOCATION", nullable = false)   // city / neighbourhood
    private String location;

    @Column(name = "ADDRESS")                      // full street address
    private String address;

    @Column(name = "REGION")                       // broad region for reports
    private String region;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE", nullable = false)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private PropertyStatus status = PropertyStatus.DRAFT;

    @Column(name = "BEDROOMS")
    private Integer bedrooms;

    @Column(name = "BATHROOMS")
    private Integer bathrooms;

    @Column(name = "SIZE_SQM", precision = 8, scale = 2)
    private BigDecimal sizeSqm;

    @Column(name = "FURNISHED", nullable = false)
    private Boolean furnished = false;

    @Column(name = "UTILITIES_INCLUDED", nullable = false)
    private Boolean utilitiesIncluded = false;

    // Stored as JSON array e.g. ["Parking","WiFi","Generator"]
    @Column(name = "AMENITIES", columnDefinition = "TEXT")
    private String amenities;

    // Stored as JSON array of file paths / URLs
    @Column(name = "IMAGE_URLS", columnDefinition = "TEXT")
    private String imageUrls;

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
// src/schemas/property.schema.ts  (replace existing)
import { z } from 'zod';

export const PropertyTypeSchema = z.enum([
  'APARTMENT', 'HOUSE', 'STUDIO', 'COMMERCIAL', 'LAND'
]);

export const PropertyStatusSchema = z.enum([
  'DRAFT', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'ARCHIVED'
]);

export const PropertySchema = z.object({
  id: z.number(),
  owner: z.object({ id: z.number(), name: z.string() }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  monthlyRent: z.number().positive('Rent must be a positive number'),
  currency: z.string().default('TZS'),
  location: z.string().min(1),
  address: z.string().optional(),
  region: z.string().optional(),
  type: PropertyTypeSchema,
  status: PropertyStatusSchema,
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  sizeSqm: z.number().positive().optional(),
  furnished: z.boolean().default(false),
  utilitiesIncluded: z.boolean().default(false),
  amenities: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PropertyFilterSchema = z.object({
  location: z.string().optional(),
  region: z.string().optional(),
  type: PropertyTypeSchema.optional(),
  status: PropertyStatusSchema.optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  bedrooms: z.number().optional(),
  furnished: z.boolean().optional(),
});

export type Property = z.infer<typeof PropertySchema>;
export type PropertyFilter = z.infer<typeof PropertyFilterSchema>;
```

### Response DTO shape (backend)

```java
// payloads/responses/property/PropertyResponse.java
public class PropertyResponse {
    Long id;
    String title;
    String description;
    BigDecimal monthlyRent;
    String currency;
    String location;
    String address;
    String region;
    String type;
    String status;
    Integer bedrooms;
    Integer bathrooms;
    BigDecimal sizeSqm;
    Boolean furnished;
    Boolean utilitiesIncluded;
    List<String> amenities;
    List<String> imageUrls;
    OwnerSummary owner;   // { id, name, verified }
    LocalDateTime createdAt;
}

// payloads/requests/property/PropertyRequest.java  (create + update)
public class PropertyRequest {
    @NotBlank String title;
    String description;
    @NotNull @Positive BigDecimal monthlyRent;
    @Size(min=3,max=3) String currency;
    @NotBlank String location;
    String address;
    String region;
    @NotNull PropertyType type;
    PropertyStatus status;
    Integer bedrooms;
    Integer bathrooms;
    BigDecimal sizeSqm;
    Boolean furnished;
    Boolean utilitiesIncluded;
    List<String> amenities;
    List<String> imageUrls;
}
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F2-01 | Create property | Authenticated `LANDLORD` | POST full valid payload | 201; row exists; `owner_id` = caller |
| F2-02 | List + filter | Several properties with different `region`, `status`, `monthlyRent` | GET with query params | Only matching rows; pagination meta correct if used |
| F2-03 | Public vs auth read | Policy chosen (public marketplace or auth-only) | GET list/detail without token (if allowed) | Consistent with policy; no sensitive owner PII if public |
| F2-04 | Read one | Property exists | GET by id | 200; shape matches contract |
| F2-05 | Update own | User A owns property | User A PUT | 200; fields updated |
| F2-06 | Update foreign | User B not owner | User B PUT User A’s property | 403 |
| F2-07 | Delete constraints | Property has `ACTIVE` lease (if rule exists) | Owner DELETE | 409 or 400 with clear reason, or soft-archive only |
| F2-08 | Validation | — | POST with missing `title` or negative rent | 400; field errors or exit message |
| F2-09 | Admin override | Admin user | Admin mutates any property | Allowed only if spec says so; 403 if not |
| F2-FE-01 | Marketplace | API returns data | Open marketplace | Filters change results; empty state when no match |
| F2-FE-02 | Owner inventory | Landlord has N properties | Open inventory | Shows exactly N; edit navigates to detail |

**Data checks:** after F2-01, DB row `STATUS` default sensible; `CREATED_AT` set.

## References

- Frontend: `queries/property.queries.ts`, `schemas/property.schema.ts`, `pages/MarketPlace.tsx`, `pages/PropertyDetail.tsx`, `pages/owner/PropertyInventory.tsx`
- Spec: Module 2 in `pms_implementation_plan.txt`
