# Feature 7 — Notification system

In-app notifications driven by domain events; optional email via existing mail service.

## Goals

- `Notification` persistence: user, message, type, read flag
- Creators: lease expiry, payment due, application status changes
- Polling-first API; WebSocket optional later

## Backend steps

1. **Entity**  
   `Notification`: `id`, `user`, `title`, `message`, `type` (enum: APPLICATION, LEASE, PAYMENT, MAINTENANCE, SYSTEM), `read` boolean, `createdAt`, optional `link` (e.g. `/tenant/lease`).

2. **Creation paths**  
   - `ApplicationListener` on events from Features 3–6 (`ApplicationApprovedEvent`, `LeaseExpiringEvent`, etc.).  
   - Scheduled job (Feature 4) inserts lease expiry notifications.  
   - Payment due: scheduler compares lease billing calendar with last payment.

3. **Email hook**  
   Optionally call `EmailService` for high-priority types; guard with config flag `app.notifications.email.enabled`.

4. **Endpoints**  
   - `GET /api/v1/notifications` — current user, pagination, `unreadOnly` query  
   - `PATCH /api/v1/notifications/{id}/read`  
   - `POST /api/v1/notifications/read-all` optional  

## Frontend steps

1. **Queries**  
   `src/queries/notification.queries.ts` with polling interval (e.g. 60s) or refetch on window focus.

2. **UI**  
   Bell icon in `Navbar` or layout headers: unread count badge, dropdown list, link navigation.

3. **i18n**  
   If message keys come from backend, display as-is; if codes, map in `en.json` / `sw.json`.

## API sketch

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/notifications` | `?page=&unreadOnly=` |
| PATCH | `/api/v1/notifications/{id}/read` | |

## Acceptance criteria

- [ ] Approving application creates notification for tenant
- [ ] Lease expiring job creates notification
- [ ] Mark-as-read updates DB and UI count

## Data model

### Enum

```java
// models/notification/NotificationType.java
public enum NotificationType {
    APPLICATION,  // tenant applied / owner approved or rejected
    LEASE,        // lease created, expiring soon, renewed
    PAYMENT,      // payment received, overdue reminder
    MAINTENANCE,  // maintenance status changed
    SYSTEM,       // platform announcements / verification
    VERIFICATION  // trust verification approved / rejected
}
```

### Java entity

```java
// models/notification/Notification.java
@Entity
@Table(
    name = "NOTIFICATIONS",
    indexes = {
        @Index(name = "idx_notif_recipient", columnList = "RECIPIENT_ID"),
        @Index(name = "idx_notif_read",      columnList = "RECIPIENT_ID, IS_READ"),
        @Index(name = "idx_notif_type",      columnList = "TYPE")
    }
)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RECIPIENT_ID", nullable = false)
    private User recipient;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "MESSAGE", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE", nullable = false)
    private NotificationType type;

    @Column(name = "IS_READ", nullable = false)
    private Boolean isRead = false;

    // Deep-link for the FE to navigate on click: "/tenant/payments", etc.
    @Column(name = "ACTION_LINK")
    private String actionLink;

    // Loose FK to the triggering domain record
    @Column(name = "RELATED_ENTITY_TYPE")
    private String relatedEntityType;  // "PAYMENT", "LEASE", etc.

    @Column(name = "RELATED_ENTITY_ID")
    private Long relatedEntityId;

    @Column(name = "READ_AT")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;
}
```

### Spring event pattern

```java
// events/ApplicationApprovedEvent.java
public record ApplicationApprovedEvent(Application application) {}

// listeners/ApplicationEventListener.java
@Component
public class ApplicationEventListener {

    @EventListener
    @Async
    public void onApproved(ApplicationApprovedEvent evt) {
        notificationService.create(
            evt.application().getTenant(),
            NotificationType.APPLICATION,
            "Application approved",
            "Your application for "
                + evt.application().getProperty().getTitle()
                + " has been approved!",
            "/tenant"
        );
    }
}
```

### Frontend: Zod schema

```typescript
// src/schemas/notification.schema.ts
import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'APPLICATION', 'LEASE', 'PAYMENT', 'MAINTENANCE', 'SYSTEM', 'VERIFICATION'
]);

export const NotificationSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  type: NotificationTypeSchema,
  isRead: z.boolean(),
  actionLink: z.string().nullable().optional(),
  relatedEntityType: z.string().nullable().optional(),
  relatedEntityId: z.number().nullable().optional(),
  readAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const NotificationListResponseSchema = z.object({
  records: z.array(NotificationSchema),
  unreadCount: z.number(),
});

export type Notification = z.infer<typeof NotificationSchema>;
```

## Testing benchmark

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F7-01 | Application approved event | Feature 3 triggers event | Approve application | Recipient tenant has new notification; type `APPLICATION` |
| F7-02 | Lease expiring | Scheduler or manual event | Fire lease expiring job | Tenants/owners receive expected notifications |
| F7-03 | List unread | Several notifications, mix read/unread | GET `unreadOnly=true` | Only unread; count matches |
| F7-04 | Mark read | Unread row exists | PATCH read | `isRead=true`; `readAt` set |
| F7-05 | Mark all read | Multiple unread | POST read-all (if implemented) | All for user read |
| F7-06 | Isolation | Users A and B | GET each | B never sees A’s notifications |
| F7-07 | Deep link | Notification has `actionLink` | FE opens link | Routes to correct screen (manual FE check) |
| F7-08 | Email side effect | Config `email.enabled=true` | Trigger high-priority event | Email send attempted (log or sandbox); no duplicate in-app storm |

**Volume benchmark:** create 50 notifications for one user; list endpoint still paginates and responds under agreed SLA (note target in runbook, not code).

## References

- Backend: `services/EmailService.java`
- Frontend: `components/Navbar.tsx`, layouts
- Depends on: Features 3–6 for meaningful triggers
