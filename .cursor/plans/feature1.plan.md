---
name: Feature 1 — User management and authentication
overview: Align auth and user admin APIs with the React app; stable JWT lifecycle, RBAC, shared API client, and optional register/refresh flows.
todos:
  - id: f1-01-verify-method-security
    content: "Backend: confirm @EnableMethodSecurity is active and @PreAuthorize on UserController (and any AuthController rules) is enforced; run F1-08/F1-09 smoke (403 for wrong role)."
    status: completed
  - id: f1-02-verify-role-authorities
    content: "Backend: confirm UserPrincipal grants ROLE_* authorities and matches all hasRole('...') usages; grep controllers for mismatches."
    status: completed
  - id: f1-03-unify-jwt-subject
    content: "Backend: pick one JWT subject strategy (email vs user id); align generateJwtToken, generateJwtTokenByUser, activate-account, refresh-token, and JwtRequestFilter + CustomUserDetailService loading."
    status: completed
  - id: f1-04-role-model-and-persistence
    content: "Backend: align Role enum and User model with spec (incl. CARETAKER/LANDLORD naming); add Flyway/Liquibase or documented SQL migration + data mapping from legacy role strings if needed."
    status: cancelled
  - id: f1-05-login-contract-and-openapi
    content: "Backend: ensure LoginResponse (and profile DTOs) expose all fields the FE needs; document auth + /users in OpenAPI with Bearer scheme and response codes."
    status: completed
  - id: f1-06-register-path-alias-or-docs
    content: "Backend: add POST /api/v1/auth/register alias to signup OR document /signup as canonical in OpenAPI/README for API consumers."
    status: completed
  - id: f1-07-frontend-api-client-401-refresh
    content: "Frontend: extend apiClient — on 401 optionally call refresh-token once, retry original request, then logout if refresh fails (phase 2 per plan)."
    status: completed
  - id: f1-08-frontend-auth-types-and-schemas
    content: "Frontend: align Zod auth schemas + authSlice with backend (roles array, tokenType, status, CARETAKER); centralize mapBackendRole + ROLE_HOME with router paths."
    status: completed
  - id: f1-09-frontend-register-activation-optional
    content: "Frontend (optional): register page, activate-account deep link, resend-verification-email; wire mutations and post-activation redirect."
    status: completed
  - id: f1-10-acceptance-and-regression
    content: "QA: tick acceptance criteria checklist; run testing benchmark F1-01–F1-10 and F1-FE-01/F1-FE-02; after security changes re-run F1-01, F1-05, F1-08."
    status: pending
---

# Feature 1 — User management and authentication

Aligns the spec (register/login, roles, admin user APIs) with the existing Spring Boot auth stack and wires the React app to real endpoints.

## Goals

- Reliable JWT lifecycle (login, refresh, activation flows)
- Method-level security that actually runs (`@PreAuthorize`)
- Role model consistent across DB, backend authorities, and frontend routes
- Shared API client with Bearer token and 401 handling

## Current codebase notes

- Auth: `POST /api/v1/auth/login`, `/signup`, `/activate-account`, `/refresh-token`, password flows — `AuthController.java`
- Users admin: `GET/POST/PUT/DELETE /api/v1/users` — `UserController.java`
- User entity: `User.java` (role as `String`, status enum)
- Frontend login is demo-only: `src/queries/auth.queries.ts`

## Backend steps (ordered)

1. **Enable method security**  
   Add `@EnableMethodSecurity` on a `@Configuration` class. Confirm `@PreAuthorize` on `UserController` / `AuthController` is evaluated.

2. **Fix `GrantedAuthority` vs `hasRole`**  
   Either prefix with `ROLE_` when building authorities in `UserPrincipal.create`, or replace `hasRole('ADMIN')` with `hasAuthority('ADMIN')` everywhere. Prefer standard `ROLE_*` for Spring conventions.

3. **Unify JWT subject**  
   `generateJwtToken` uses email; `generateJwtTokenByUser` uses numeric id. Choose one strategy:
   - **A (recommended):** Always use email as subject; or  
   - **B:** Always use numeric id and in `JwtRequestFilter` branch: if subject parses as `Long`, call `loadUserById`, else `loadUserByUsername`.

4. **Role enum and migration**  
   Introduce `Role` enum: `TENANT`, `LANDLORD`, `CARETAKER`, `ADMIN` (extend if keeping `SUPER_ADMIN`). Migration plan from existing `USER`, `MANAGER`, etc. Document mapping table (e.g. `USER` → `TENANT`, `MANAGER` → `CARETAKER`).

5. **Stable login contract**  
   Ensure `LoginResponse` includes fields the FE needs: access token, refresh token, expiration, and user `{ id, email, name, role, status, ... }`. Document in OpenAPI (Feature 0).

6. **Register path**  
   Spec says `POST /auth/register`; backend has `POST /api/v1/auth/signup`. Either alias `register` → `signup` or document `/signup` as canonical.

## Frontend steps (ordered)

1. **`src/lib/apiClient.ts`**  
   Axios or fetch wrapper: `baseURL`, `Authorization: Bearer ${token}` from Redux (or secure storage), response interceptors for 401.

2. **Real login mutation**  
   Replace demo in `auth.queries.ts` with `POST /api/v1/auth/login`. Parse backend `LoginResponse`; dispatch `setCredentials`.

3. **Role mapping**  
   Map backend role strings to `UserRole` in `authSlice.ts` (`admin` | `tenant` | `owner` | `landlord` lowercase). Align naming with backend enum (single source of truth doc).

4. **Post-login redirect**  
   After login, navigate to `/${role}` consistent with `router.tsx` (`/admin`, `/tenant`, `/owner`).

5. **Register + activation (optional product scope)**  
   Pages: register form → pending; link from email → call `activate-account` with token; optional `resend-verification-email`.

6. **Refresh token (phase 2)**  
   On 401, attempt `refresh-token` once, then retry or logout.

## API sketch (existing + confirm)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/v1/auth/login` | Body: email, password |
| POST | `/api/v1/auth/signup` | Body: `UserRequest` |
| POST | `/api/v1/auth/activate-account?token=` | |
| POST | `/api/v1/auth/refresh-token` | Body: refreshToken |
| GET | `/api/v1/auth/profile` | Bearer |
| GET | `/api/v1/users` | Admin; paginated |

## Acceptance criteria

- [ ] Login with real user returns JWT usable on protected `/api/v1/*` routes
- [ ] Tokens from `activate-account` and `refresh-token` load user correctly in filter
- [ ] Non-admin cannot call admin-only user endpoints (403)
- [ ] Frontend login stores token and shows correct dashboard by role

## Data model

### Role enum (replace existing `String role` field)

```java
// models/Role.java
public enum Role {
    TENANT,      // renter; applies, pays rent, raises maintenance
    LANDLORD,    // property owner; manages listings, leases, finances
    CARETAKER,   // delegated property manager; can't own but can manage
    ADMIN,       // platform staff; full read + moderate actions
    SUPER_ADMIN  // full system control; can delete users, change roles
}
```

### User entity (extends existing — additions only)

```java
// models/User.java  — add / change these fields:

@Column(name = "ROLE")
@Enumerated(EnumType.STRING)
private Role role;                      // was String — change to enum

@Column(name = "VERIFIED", nullable = false)
private Boolean verified = false;       // set true by Feature 10 approval

@Column(name = "AVATAR_URL")
private String avatarUrl;               // profile picture URL (replaces `image`)

// Keep all existing OTP / refresh / password-reset / permissions fields
```

### Database index additions

```sql
-- Ensure fast role-scoped queries
CREATE INDEX idx_users_role ON USERS(ROLE);
CREATE INDEX idx_users_status_role ON USERS(STATUS, ROLE);
```

### Frontend: Zod schema

```typescript
// src/schemas/auth.schema.ts (extend existing)
import { z } from 'zod';

export const RoleSchema = z.enum([
  'TENANT', 'LANDLORD', 'CARETAKER', 'ADMIN', 'SUPER_ADMIN'
]);

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  role: RoleSchema,
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED']),
  verified: z.boolean(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  tokenExpiration: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});

export type Role = z.infer<typeof RoleSchema>;
export type AuthUser = z.infer<typeof UserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
```

### Frontend: Redux `authSlice` aligned types

```typescript
// src/store/slices/authSlice.ts
export type UserRole = 'TENANT' | 'LANDLORD' | 'CARETAKER' | 'ADMIN' | 'SUPER_ADMIN';

// Route map (src/lib/roles.ts)
export const ROLE_HOME: Record<UserRole, string> = {
  TENANT:      '/tenant',
  LANDLORD:    '/owner',
  CARETAKER:   '/owner',
  ADMIN:       '/admin',
  SUPER_ADMIN: '/admin',
};
```

## Testing benchmark

Use these scenarios as the **minimum bar** before calling auth done (manual QA or future automated tests can map 1:1 to them). No code below—only behaviour to verify.

| ID | Scenario | Preconditions | Steps (high level) | Expected outcome |
|----|----------|---------------|--------------------|------------------|
| F1-01 | Happy login | User exists, `ACTIVE`, correct password | POST login with email + password | 200; body has non-empty `token`, `refreshToken`, user with `role` matching DB |
| F1-02 | Wrong password | User exists | POST login with bad password | 401; generic “invalid credentials” style message; no token |
| F1-03 | Pending / disabled user | User `PENDING` or `DISABLED` | POST login | 400 or 403; no session |
| F1-04 | JWT on protected route | Valid token from F1-01 | GET `/api/v1/auth/profile` with Bearer | 200; profile matches user |
| F1-05 | Missing token | — | GET any protected endpoint without `Authorization` | 401 |
| F1-06 | Refresh flow | Valid refresh token | POST `/api/v1/auth/refresh-token` | New access + refresh tokens; old refresh invalidated if that is the policy |
| F1-07 | Activate account | User signed up, valid emailed token | POST `activate-account?token=` | Account `ACTIVE`; response includes usable JWT if designed that way |
| F1-08 | Method security | Two users: `ADMIN` and `TENANT` | `TENANT` calls admin-only `GET /users` | 403 |
| F1-09 | Role authority | Same as DB role strings | Any `@PreAuthorize(hasRole(...))` endpoint | Pass for matching role; 403 otherwise (authorities must match Spring `ROLE_*` convention) |
| F1-10 | JWT subject consistency | User obtained token via login *and* via activate/refresh | Use both tokens on `/profile` | Both succeed; filter resolves user correctly (email vs id strategy is unified) |
| F1-FE-01 | FE login | API wired | Submit valid credentials on login page | Redirect to correct home for role; token stored per app policy |
| F1-FE-02 | FE 401 handling | Token expired or cleared | Call protected API from app | User logged out or refresh attempted once; no silent failure |

**Regression slice:** run F1-01, F1-04, F1-05, F1-08 after any security config change.

## References

- Backend: `config/AppSecurityConfig.java`, `security/JwtProvider.java`, `security/JwtRequestFilter.java`, `security/UserPrincipal.java`
- Frontend: `queries/auth.queries.ts`, `store/slices/authSlice.ts`, `pages/LoginPage.tsx`, `helper/require-auth.tsx`
