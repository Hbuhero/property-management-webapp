import { mapBackendRolesToUserRole } from '@/lib/authRole';
import { LoginResponseSchema } from '@/lib/contracts/preVisualMapContracts';
import type { User } from '@/store/slices/authSlice';

/** Maps a successful login / refresh / activate JSON body into Redux credentials. */
export function credentialsFromLoginResponse(raw: unknown): {
    user: User;
    token: string;
    refreshToken: string;
} | null {
    const parsed = LoginResponseSchema.safeParse(raw);
    if (!parsed.success) {
        return null;
    }

    const { user: u, token, refreshToken } = parsed.data;
    return {
        user: {
            id: String(u.id),
            email: u.email,
            name: u.name,
            role: mapBackendRolesToUserRole(u.roles),
            avatar: u.image ?? undefined,
            backendRoles: u.roles,
            accountStatus: u.status,
        },
        token,
        refreshToken,
    };
}
