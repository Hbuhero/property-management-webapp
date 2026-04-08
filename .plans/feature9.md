# Feature 9 — Role-based access control (RBAC)

Enforce consistent authorization on every backend endpoint and matching route guards on the frontend. Overlaps Feature 1 but focuses on **system-wide patterns** as new modules land.

## Goals

- Single role/authority model documented and tested
- No “auth by obscurity” (hiding buttons only)
- Integration tests or manual test matrix per role

## Backend steps

1. **Naming**  
   Align `Role` enum with authorities (`ROLE_TENANT`, etc.). Document which roles access which controllers in a short `SECURITY.md` or OpenAPI tags.

2. **Controller annotations**  
   Every new controller: class-level or method-level `@PreAuthorize`. Prefer reusable expressions:
   - `@PreAuthorize("@security.isPropertyOwner(#propertyId)")` via custom `SecurityExpression` bean if rules get complex.

3. **Principal access**  
   Use `@CurrentUser UserPrincipal` for ownership checks inside services when SpEL is insufficient.

4. **Tests**  
   `@SpringBootTest` + `MockMvc` with JWT fixtures per role; assert 403 for wrong role.

5. **Public endpoints**  
   Keep whitelist in `AppSecurityConfig` minimal (`/api/v1/auth/**`, swagger, static); document changes.

## Frontend steps

1. **`RequireRole` component**  
   Wrap routes or layouts: `allowedRoles={['admin']}`; if user role missing, `<Navigate to="/" />` or `/login`.

2. **Apply to routers**  
   - Admin branch: only `ADMIN` / `SUPER_ADMIN` (map from backend).  
   - Tenant branch: `TENANT`.  
   - Owner branch: `LANDLORD` (and `owner` path alias).

3. **UI hints**  
   Hide destructive actions when role insufficient; still rely on backend 403.

4. **Central map**  
   `src/lib/roles.ts`: `backendRoleToRouteHome`, `canAccess( path )`.

## Acceptance criteria

- [ ] User with tenant role cannot load `/admin` routes (redirect)
- [ ] Direct API call to foreign resource returns 403
- [ ] Test matrix documented: at least 4 roles × critical endpoints

## Data model

RBAC is a cross-cutting concern with no dedicated DB table, but it has a defined model in code.

### Backend: authority model

```java
// The authority prefixed with ROLE_ enables Spring's hasRole() helper
UserPrincipal.create(user):
  authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
  // e.g. ROLE_TENANT, ROLE_LANDLORD, ROLE_ADMIN, ROLE_SUPER_ADMIN

// Access matrix per role:
// ─────────────────────────────────────────────────────────
// Resource               TENANT  LANDLORD CARETAKER ADMIN  SUPER
// ─────────────────────────────────────────────────────────
// Auth                   ✓       ✓        ✓         ✓      ✓
// Own profile            ✓       ✓        ✓         ✓      ✓
// Users list             -       -        -         ✓      ✓
// Create property        -       ✓        -         ✓      ✓
// Edit own property      -       ✓        ✓*        ✓      ✓
// Apply to property      ✓       -        -         -      -
// Approve application    -       ✓        ✓*        ✓      ✓
// Create lease           -       ✓        ✓*        ✓      ✓
// View own lease         ✓       -        -         ✓      ✓
// Create payment         ✓       -        -         ✓      ✓
// View payments          ✓ (own) ✓(prop)  ✓(prop*)  ✓      ✓
// Maintenance (create)   ✓       -        -         ✓      ✓
// Maintenance (update)   -       ✓        ✓         ✓      ✓
// Notifications          ✓       ✓        ✓         ✓      ✓
// Reports                -       ✓(own)   -         ✓      ✓
// System issues          ✓       ✓        ✓         ✓      ✓
// Verifications (admin)  -       -        -         ✓      ✓
// ─────────────────────────────────────────────────────────
// * CARETAKER scoped to properties assigned to their landlord (future enhancement)
```

### Security expression bean (for complex ownership checks)

```java
// security/SecurityExpressions.java
@Component("sec")
public class SecurityExpressions {

    public boolean isPropertyOwner(Long propertyId, UserPrincipal principal) {
        return propertyRepository
            .findById(propertyId)
            .map(p -> p.getOwner().getId().equals(principal.getId()))
            .orElse(false);
    }

    public boolean isLeaseParty(Long leaseId, UserPrincipal principal) {
        return leaseRepository
            .findById(leaseId)
            .map(l -> l.getTenant().getId().equals(principal.getId())
                   || l.getProperty().getOwner().getId().equals(principal.getId()))
            .orElse(false);
    }
}

// Usage in controller:
@PreAuthorize("hasRole('ADMIN') or @sec.isPropertyOwner(#id, principal)")
public ResponseEntity<?> updateProperty(@PathVariable Long id, ...) { ... }
```

### Frontend: role model

```typescript
// src/lib/roles.ts
export type UserRole = 'TENANT' | 'LANDLORD' | 'CARETAKER' | 'ADMIN' | 'SUPER_ADMIN';

export const ROLE_HOME: Record<UserRole, string> = {
  TENANT:      '/tenant',
  LANDLORD:    '/owner',
  CARETAKER:   '/owner',
  ADMIN:       '/admin',
  SUPER_ADMIN: '/admin',
};

// Which roles can access a given path prefix
export const ROUTE_ROLES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/admin',  roles: ['ADMIN', 'SUPER_ADMIN'] },
  { prefix: '/tenant', roles: ['TENANT'] },
  { prefix: '/owner',  roles: ['LANDLORD', 'CARETAKER'] },
];

export function canAccess(path: string, role: UserRole): boolean {
  const rule = ROUTE_ROLES.find(r => path.startsWith(r.prefix));
  return rule ? rule.roles.includes(role) : true;
}
```

### `RequireRole` component

```tsx
// src/helper/require-role.tsx
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppStore';
import { canAccess, ROLE_HOME } from '@/lib/roles';

interface Props { allowedRoles: UserRole[]; children: React.ReactNode; }

export const RequireRole = ({ allowedRoles, children }: Props) => {
  const user = useAppSelector(s => s.auth.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
  }
  return <>{children}</>;
};
```

## Testing benchmark

Treat RBAC as **cross-feature gates**: every role × critical path below should be recorded pass/fail.

| ID | Scenario | Preconditions | Steps | Expected outcome |
|----|----------|---------------|-------|------------------|
| F9-01 | Tenant → admin URL | Logged in as `TENANT` | Browser: open `/admin/...` | Redirect or 403 on API |
| F9-02 | Landlord → tenant URL | Logged in as `LANDLORD` | Open `/tenant/...` | Blocked per `RequireRole` |
| F9-03 | Admin → owner | `ADMIN` | Open `/owner/...` | Blocked unless product allows staff impersonation |
| F9-04 | Caretaker | `CARETAKER` | Access routes assigned in matrix | Only caretaker-allowed |
| F9-05 | SpEL property | User not owner | Call update property | 403 even if path guessed |
| F9-06 | SpEL lease party | Non-party | Call lease detail | 403/404 |
| F9-FE-01 | Deep link after logout | — | Paste protected URL | Login → redirect to intended route only if role matches |
| F9-FE-02 | Token tamper | Modify JWT payload in client | Next API call | 401 |

**Matrix:** rows = roles (`TENANT`, `LANDLORD`, `CARETAKER`, `ADMIN`, `SUPER_ADMIN`); columns = one GET + one mutating endpoint per domain module; cell = expect allow/deny.

## References

- Backend: `config/AppSecurityConfig.java`, `security/UserPrincipal.java`
- Frontend: `helper/require-auth.tsx`, `router.tsx`, `store/slices/authSlice.ts`
- Depends on: Feature 1 fixes (authorities + JWT)
