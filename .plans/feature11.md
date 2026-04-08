# Feature 11 — Reporting and analytics

Read-only aggregates for owners and admins: revenue, occupancy, trends.

## Goals

- Backend aggregation endpoints over `payments`, `properties`, `leases`
- Frontend charts on owner financials and admin overview

## Backend steps

1. **Queries**  
   Use Spring Data JPA `@Query` or JDBC for performance on aggregates:
   - **Financial:** sum of `SUCCEEDED` payments by month, filter by owner (via property → payment/lease join).
   - **Occupancy:** count properties `RENTED` vs total; or properties with `ACTIVE` lease / total.

2. **Endpoints**  
   - `GET /api/v1/reports/financial?from=&to=&ownerId=` — `ownerId` optional; non-admin only self  
   - `GET /api/v1/reports/properties` — counts by status, region if modeled  

3. **DTOs**  
   Return chart-friendly series: `[{ period, amount }]`, `[{ label, value }]`.

4. **Caching (optional)**  
   `@Cacheable` on heavy reports with short TTL.

## Frontend steps

1. **Library**  
   Add chart dependency (e.g. Recharts) if not present; keep theme consistent with Tailwind/dark mode.

2. **Owner**  
   Extend `pages/owner/FinancialReports.tsx` with charts fed by report API.

3. **Admin**  
   `pages/admin/SystemHealth.tsx` or dashboard index: high-level KPIs from property report.

4. **Queries**  
   `src/queries/reports.queries.ts`.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/reports/financial` | Date range |
| GET | `/api/v1/reports/properties` | |

## Acceptance criteria

- [ ] Owner sees revenue series matching sum of payment rows in test DB
- [ ] Non-owner cannot pass another owner’s id (403)
- [ ] Charts render with empty state when no data

## Data model

Reports are derived — no dedicated tables. The model is defined by the query DTOs and the frontend schemas.

### Backend: report DTOs (no entity; read-only projections)

```java
// payloads/responses/reports/FinancialReportResponse.java
public class FinancialReportResponse {
    String ownerId;
    String ownerName;
    BigDecimal totalRevenue;       // all SUCCEEDED payments in period
    BigDecimal expectedRevenue;    // sum of monthlyRent × active leases
    BigDecimal collectionRate;     // totalRevenue / expectedRevenue %
    List<RevenuePeriod> byPeriod;  // monthly breakdown
    List<PropertyRevenue> byProperty;

    public record RevenuePeriod(String period, BigDecimal amount, int paymentCount) {}
    public record PropertyRevenue(Long propertyId, String title,
                                  BigDecimal revenue, String currency) {}
}

// payloads/responses/reports/PropertyReportResponse.java
public class PropertyReportResponse {
    int totalProperties;
    int available;
    int rented;
    int maintenance;
    int draft;
    int archived;
    double occupancyRate;    // rented / (rented + available) %
    List<RegionSummary> byRegion;
    List<TypeSummary> byType;

    public record RegionSummary(String region, int total, int rented) {}
    public record TypeSummary(String type,   int total, int rented) {}
}

// payloads/responses/reports/AdminDashboardResponse.java
public class AdminDashboardResponse {
    long totalUsers;
    long activeTenants;
    long activeLandlords;
    long totalProperties;
    double platformOccupancyRate;
    BigDecimal platformRevenue30d;
    int openMaintenanceRequests;
    int pendingApplications;
    int pendingVerifications;
    int openSystemIssues;
}
```

### JPA query examples

```java
// repositories/PaymentRepository.java
@Query("""
    SELECT FUNCTION('TO_CHAR', p.paidAt, 'YYYY-MM') AS period,
           SUM(p.amount) AS total,
           COUNT(p.id)   AS cnt
    FROM   Payment p
    WHERE  p.status = 'SUCCEEDED'
      AND  p.lease.property.owner.id = :ownerId
      AND  p.paidAt BETWEEN :from AND :to
    GROUP BY FUNCTION('TO_CHAR', p.paidAt, 'YYYY-MM')
    ORDER BY period
""")
List<Object[]> revenueByPeriod(@Param("ownerId") Long ownerId,
                                @Param("from")    LocalDateTime from,
                                @Param("to")      LocalDateTime to);

// repositories/PropertyRepository.java
@Query("""
    SELECT p.status, COUNT(p)
    FROM   Property p
    WHERE  (:ownerId IS NULL OR p.owner.id = :ownerId)
    GROUP BY p.status
""")
List<Object[]> countByStatus(@Param("ownerId") Long ownerId);
```

### Frontend: Zod schema

```typescript
// src/schemas/reports.schema.ts
import { z } from 'zod';

export const RevenuePeriodSchema = z.object({
  period: z.string(),       // "YYYY-MM"
  amount: z.number(),
  paymentCount: z.number(),
});

export const FinancialReportSchema = z.object({
  totalRevenue: z.number(),
  expectedRevenue: z.number(),
  collectionRate: z.number(),   // 0–100 %
  byPeriod: z.array(RevenuePeriodSchema),
  byProperty: z.array(z.object({
    propertyId: z.number(),
    title: z.string(),
    revenue: z.number(),
    currency: z.string(),
  })),
});

export const PropertyReportSchema = z.object({
  totalProperties: z.number(),
  available: z.number(),
  rented: z.number(),
  maintenance: z.number(),
  draft: z.number(),
  archived: z.number(),
  occupancyRate: z.number(),
  byRegion: z.array(z.object({ region: z.string(), total: z.number(), rented: z.number() })),
  byType: z.array(z.object({ type: z.string(), total: z.number(), rented: z.number() })),
});

export const AdminDashboardSchema = z.object({
  totalUsers: z.number(),
  activeTenants: z.number(),
  activeLandlords: z.number(),
  totalProperties: z.number(),
  platformOccupancyRate: z.number(),
  platformRevenue30d: z.number(),
  openMaintenanceRequests: z.number(),
  pendingApplications: z.number(),
  pendingVerifications: z.number(),
  openSystemIssues: z.number(),
});

export const ReportFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ownerId: z.number().optional(),  // admin only
});

export type FinancialReport = z.infer<typeof FinancialReportSchema>;
export type PropertyReport  = z.infer<typeof PropertyReportSchema>;
export type AdminDashboard  = z.infer<typeof AdminDashboardSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F11-01 | Financial report | Known payments in date range | GET financial with `from`/`to` | `totalRevenue` equals sum of succeeded amounts in range (spreadsheet check) |
| F11-02 | Owner scoping | Landlord A and B each have payments | A calls with B’s `ownerId` | 403 or ignore B id |
| F11-03 | Empty range | No payments | GET | Zeros; empty series; no error |
| F11-04 | Property report | Mix of statuses | GET properties report | Counts match raw `COUNT(*)` queries |
| F11-05 | Occupancy | N available, M rented | GET | Rate matches `M / (N+M)` or documented formula |
| F11-06 | Admin dashboard | Platform seed data | GET admin KPIs | Fields consistent with underlying aggregates |
| F11-07 | Cache (if any) | Second identical request | Repeat GET | Same numbers; optional `Cache-Control` behaviour |
| F11-FE-01 | Charts | API returns series | Owner financials page | Renders without crash; tooltips match values |

**Numerical benchmark:** seed: 3 payments 100+200+300 in January; report January `totalRevenue=600`.

## References

- Frontend: `pages/owner/FinancialReports.tsx`, `pages/admin/SystemHealth.tsx`
- Depends on: Features 2, 4, 5 (data sources)
