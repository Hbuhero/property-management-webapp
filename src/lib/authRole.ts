import type { UserRole } from '@/store/slices/authSlice';

/**
 * Default dashboard URL per UI role (post-login, `RequireRole` fallback).
 * Must stay aligned with protected path segments in `router.tsx`
 * (`/admin`, `/tenant`, `/owner`, `/landlord`).
 */
export const ROLE_HOME: Record<UserRole, string> = {
    admin: '/admin',
    tenant: '/tenant',
    landlord: '/landlord',
    owner: '/owner',
};

export function homePathForRole(role: UserRole): string {
    return ROLE_HOME[role];
}

/**
 * Maps backend `Role` enum strings (JWT / login `roles[]`) to one UI route role.
 * @see dev.hud.PropertyManagementSystem.models.Role
 */
export function mapBackendRolesToUserRole(roles: string[]): UserRole {
    const upper = new Set(roles.map((r) => r.toUpperCase()));

    if (upper.has('SUPER_ADMIN') || upper.has('ADMIN')) {
        return 'admin';
    }
    if (upper.has('TENANT')) {
        return 'tenant';
    }
    if (upper.has('CARETAKER')) {
        return 'landlord';
    }
    if (upper.has('LANDLORD') || upper.has('LAND_LORD')) {
        return 'landlord';
    }
    if (upper.has('USER')) {
        return 'tenant';
    }

    return 'tenant';
}
