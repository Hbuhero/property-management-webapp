import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppStore';
import { ROLE_HOME } from '@/lib/authRole';
import type { UserRole } from '@/store/slices/authSlice';

type RequireRoleProps = {
    allowedRoles: readonly UserRole[];
};

/**
 * Requires an authenticated user whose `user.role` is in `allowedRoles`.
 * Otherwise redirects to login (if anonymous) or to the user's role home.
 */
export default function RequireRole({ allowedRoles }: RequireRoleProps) {
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const user = useAppSelector((s) => s.auth.user);
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        const fallback = ROLE_HOME[user.role] ?? '/';
        return <Navigate to={fallback} replace />;
    }

    return <Outlet />;
}
