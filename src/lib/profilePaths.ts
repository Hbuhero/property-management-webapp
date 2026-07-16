import type { UserRole } from '@/store/slices/authSlice';

export function profilePathForRole(role: UserRole): string {
    return `/${role}/profile`;
}

export function editProfilePathForRole(role: UserRole): string {
    return `/${role}/profile/edit`;
}

/** Pick the backend role to send on self-service profile updates. */
export function primaryBackendRole(roles: string[]): string {
    const upper = new Set(roles.map((r) => r.toUpperCase()));
    const order = ['SUPER_ADMIN', 'ADMIN', 'LAND_LORD', 'TENANT', 'USER'] as const;
    for (const role of order) {
        if (upper.has(role)) return role;
    }
    return roles[0] ?? 'USER';
}
