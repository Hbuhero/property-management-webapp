/**
 * Frozen API contracts for prerequisites → Visual Property Map (V2).
 *
 * Source of truth for JSON shapes: backend Java types
 * - {@link dev.hud.PropertyManagementSystem.payloads.responses.auth.LoginResponse}
 * - {@link dev.hud.PropertyManagementSystem.services.AuthService#getUserInformation}
 *
 * Keep this file in sync with the backend when those types change.
 */

import { z } from 'zod';

/** Matches {@code dev.hud.PropertyManagementSystem.utils.Constants.API_V1} */
export const API_V1_PREFIX = '/api/v1' as const;

/**
 * Backend {@code Role} enum names (string form in JWT / login JSON).
 * @see dev.hud.PropertyManagementSystem.models.Role
 */
export const BackendRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    USER: 'USER',
    TENANT: 'TENANT',
    LAND_LORD: 'LAND_LORD',
    /** Reserved for future backend enum; mapper already recognizes it. */
    CARETAKER: 'CARETAKER',
} as const;

export type BackendRoleName = (typeof BackendRole)[keyof typeof BackendRole];

/** {@link dev.hud.PropertyManagementSystem.models.UserStatus} names in API JSON. */
export const BackendUserStatus = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED'] as const;

export type BackendUserStatusName = (typeof BackendUserStatus)[number];

/**
 * Spring authorities use {@code ROLE_} + enum name (e.g. {@code ROLE_ADMIN}) so
 * {@code @PreAuthorize("hasRole('ADMIN')")} resolves correctly.
 *
 * @see dev.hud.PropertyManagementSystem.security.UserPrincipal#create
 */

/** Login {@code POST /api/v1/auth/login} success body (200). */
export const LoginResponseUserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    /** Backend {@code Role} enum names; unknown strings allowed for forward compatibility. */
    roles: z.array(z.string()),
    passwordReset: z.boolean().nullable().optional(),
    /** Jackson may emit ISO string or array; accept any until serializers are fixed. */
    createdAt: z.union([z.string(), z.array(z.number())]).optional(),
    status: z.enum(BackendUserStatus),
});

export const LoginResponseSchema = z.object({
    user: LoginResponseUserSchema,
    tokenType: z.literal('Bearer').optional().default('Bearer'),
    token: z.string(),
    tokenExpiration: z.string(),
    refreshToken: z.string(),
});

export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
export type LoginResponseUserDto = z.infer<typeof LoginResponseUserSchema>;

/** {@code POST /api/v1/auth/signup|register} success body. */
export const SignupResponseSchema = z.object({
    message: z.string(),
    email: z.string(),
    status: z.string(),
});

export type SignupResponseDto = z.infer<typeof SignupResponseSchema>;

/** Visual Map (V2) — public + admin routes under {@link API_V1_PREFIX}. */
export const VisualMapApi = {
    /** {@code GET /api/v1/floors/{floorId}/map} — public, unauthenticated read. */
    floorMap: (floorId: number | string) =>
        `${API_V1_PREFIX}/floors/${encodeURIComponent(String(floorId))}/map`,

    /** {@code POST /api/v1/admin/floors/{floorId}/plan} — multipart floor plan upload. */
    adminFloorPlan: (floorId: number | string) =>
        `${API_V1_PREFIX}/admin/floors/${encodeURIComponent(String(floorId))}/plan`,

    /** {@code PUT /api/v1/admin/floors/units/{unitId}/overlay} — overlay bounds (%). */
    adminUnitOverlay: (unitId: number | string) =>
        `${API_V1_PREFIX}/admin/floors/units/${encodeURIComponent(String(unitId))}/overlay`,

    /** {@code PATCH /api/v1/admin/floors/units/{unitId}/status} — AVAILABLE | OCCUPIED. */
    adminUnitStatus: (unitId: number | string) =>
        `${API_V1_PREFIX}/admin/floors/units/${encodeURIComponent(String(unitId))}/status`,
} as const;
