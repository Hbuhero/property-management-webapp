# Feature 5 — Financial management (payments)

Record rent payments, outstanding balance, and a simulated payment provider for demos.

## Goals

- `Payment` linked to lease and tenant
- Initiate/confirm payment through pluggable `PaymentProvider`
- Read APIs for history and balance

## Backend steps

1. **Interface**  
   ```text
   PaymentProvider: initiatePayment(amount, metadata) -> providerRef
                    confirmPayment(providerRef) -> PaymentStatus
   ```
   Implementation: `SimulatedPaymentProvider` — random or deterministic success/pending/fail for testing.

2. **Entity**  
   `Payment`: `id`, `tenant`, `lease`, `amount`, `currency`, `status` (PENDING, SUCCEEDED, FAILED), `paidAt`, `externalRef`, `verified` boolean, timestamps.

3. **Balance logic**  
   Define billing period rules (e.g. monthly from lease start). Outstanding = sum(expected amounts for open periods) − sum(`SUCCEEDED` payments). Document formula in code comments and API.

4. **Endpoints**  
   - `POST /api/v1/payments` — body: `leaseId`, `amount` (optional if default rent); returns updated payment + simulated provider step  
   - `GET /api/v1/payments` — scoped: tenant sees own; owner sees payments for their leases  
   - `GET /api/v1/payments/tenant/{tenantId}` — tighten: only self or admin/owner of related property  

5. **Verification flag**  
   For simulation, set `verified = true` when `SUCCEEDED`. For real gateway later, webhook confirms.

## Frontend steps

1. **Queries**  
   `src/queries/payment.queries.ts`: history, create payment, balance endpoint if split.

2. **Payment hub**  
   Replace stub in `pages/tenant/PaymentHub.tsx`: show real balance, history table, pay button calling API + simulation UX.

3. **Owner finances**  
   `pages/owner/FinancialReports.tsx`: aggregate income from payments (or call report API from Feature 11).

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/payments` | Body: leaseId, amount |
| GET | `/api/v1/payments` | Query: leaseId, dateRange |
| GET | `/api/v1/payments/balance` or on lease DTO | Optional dedicated resource |

## Acceptance criteria

- [ ] Tenant records payment; status transitions in DB
- [ ] Simulated provider can be swapped without changing controller logic
- [ ] Balance matches payment rows for test scenarios

## Data model

### Enums

```java
// models/payment/PaymentStatus.java
public enum PaymentStatus {
    PENDING,     // initiated, waiting provider confirmation
    PROCESSING,  // provider received, awaiting settlement
    SUCCEEDED,   // confirmed paid
    FAILED,      // provider rejected
    REFUNDED     // reversed after success
}

// models/payment/PaymentMethod.java
public enum PaymentMethod {
    MPESA,         // M-Pesa (Vodacom Tanzania)
    TIGO_PESA,     // Tigo Pesa
    AIRTEL_MONEY,  // Airtel Money Tanzania
    HALOPESA,      // HaloPesa (TTCL)
    BANK_TRANSFER, // direct bank
    CASH,          // in-person; manually recorded by owner
    SIMULATED      // demo mode — no real money
}
```

### Java entity

```java
// models/payment/Payment.java
@Entity
@Table(
    name = "PAYMENTS",
    indexes = {
        @Index(name = "idx_payment_tenant",         columnList = "TENANT_ID"),
        @Index(name = "idx_payment_lease",          columnList = "LEASE_ID"),
        @Index(name = "idx_payment_status",         columnList = "STATUS"),
        @Index(name = "idx_payment_billing_period", columnList = "BILLING_PERIOD")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Payment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TENANT_ID", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LEASE_ID", nullable = false)
    private Lease lease;

    @Column(name = "AMOUNT", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "CURRENCY", length = 3, nullable = false)
    private String currency = "TZS";

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "PAYMENT_METHOD", nullable = false)
    private PaymentMethod paymentMethod;

    // "2025-04" — which rent month this payment covers
    @Column(name = "BILLING_PERIOD", length = 7)
    private String billingPeriod;

    // Reference returned by external payment provider
    @Column(name = "PROVIDER_REF")
    private String providerRef;

    // Raw JSON response from provider (truncated if large)
    @Column(name = "PROVIDER_RESPONSE", columnDefinition = "TEXT")
    private String providerResponse;

    @Column(name = "VERIFIED", nullable = false)
    private Boolean verified = false;

    @Column(name = "PAID_AT")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
```

### PaymentProvider interface (service layer)

```java
// services/payment/PaymentProvider.java
public interface PaymentProvider {
    PaymentInitResult initiate(BigDecimal amount, String currency,
                               String phone, String reference);
    PaymentStatus    confirm(String providerRef);
    String           name();   // "MPESA", "SIMULATED", etc.
}

// services/payment/SimulatedPaymentProvider.java
@Service
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "simulated")
public class SimulatedPaymentProvider implements PaymentProvider {
    // Always returns SUCCEEDED after a 1–3 s synthetic delay
    // Toggle via app.payment.simulation.alwaysSucceed=true|false
}
```

### Balance logic (service)

```java
// Billing periods = months in [lease.startDate, today]
// Expected = count(periods) × lease.monthlyRent
// Paid     = SUM(amount WHERE status=SUCCEEDED AND billingPeriod IN periods)
// Balance  = Expected − Paid   (capped at 0 minimum)
```

### Frontend: Zod schema

```typescript
// src/schemas/payment.schema.ts
import { z } from 'zod';

export const PaymentStatusSchema = z.enum([
  'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'
]);

export const PaymentMethodSchema = z.enum([
  'MPESA', 'TIGO_PESA', 'AIRTEL_MONEY', 'HALOPESA',
  'BANK_TRANSFER', 'CASH', 'SIMULATED'
]);

export const PaymentSchema = z.object({
  id: z.number(),
  tenant: z.object({ id: z.number(), name: z.string() }),
  lease: z.object({ id: z.number(), property: z.object({ title: z.string() }) }),
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusSchema,
  paymentMethod: PaymentMethodSchema,
  billingPeriod: z.string().optional(),   // "YYYY-MM"
  providerRef: z.string().nullable().optional(),
  verified: z.boolean(),
  paidAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const CreatePaymentSchema = z.object({
  leaseId: z.number(),
  amount: z.number().positive().optional(),  // if omitted, defaults to lease.monthlyRent
  paymentMethod: PaymentMethodSchema,
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/).optional(),  // "YYYY-MM"
  phone: z.string().optional(),              // for mobile money
});

export const BalanceResponseSchema = z.object({
  leaseId: z.number(),
  monthlyRent: z.number(),
  currency: z.string(),
  totalExpected: z.number(),
  totalPaid: z.number(),
  outstanding: z.number(),
  nextDueDate: z.string(),
  billingPeriods: z.array(z.object({
    period: z.string(),
    expected: z.number(),
    paid: z.number(),
    status: z.enum(['PAID', 'PARTIAL', 'OVERDUE', 'UPCOMING']),
  })),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F5-01 | Initiate payment | `ACTIVE` lease, tenant is party | POST payment with amount + method | Row `PENDING` or `PROCESSING` then terminal state per provider |
| F5-02 | Simulated success | `SimulatedPaymentProvider` | Complete flow | Status `SUCCEEDED`; `verified=true` if spec; `paidAt` set |
| F5-03 | Wrong tenant | User B not on lease | POST for lease of User A | 403 |
| F5-04 | Amount default | Omit amount in body | POST | Uses `monthlyRent` from lease |
| F5-05 | List scoped | Payments exist for two tenants | GET as each tenant | Only own payments |
| F5-06 | Owner visibility | Landlord owns lease’s property | GET payments | Sees payments for those leases |
| F5-07 | Balance endpoint | Known rent + N succeeded payments | GET balance for lease | Outstanding matches hand calculation for test months |
| F5-08 | Billing period | Two payments same lease different `billingPeriod` | POST twice | Both rows; balance reflects double-pay or credit per rules |
| F5-09 | Failed provider | Sim toggled to fail | POST | Status `FAILED`; no `paidAt` |
| F5-FE-01 | Payment hub | Tenant | Pay + history | Balance and list refresh; error toast on failure |

**Benchmark numbers:** seed one lease TZS 500_000/month; pay 500_000 for March → outstanding drops for March only.

## References

- Frontend: `pages/tenant/PaymentHub.tsx`, `pages/owner/FinancialReports.tsx`
- Depends on: Feature 4 (leases)
