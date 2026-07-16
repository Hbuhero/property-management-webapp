import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppStore';
import { useLogout } from '@/hooks/useLogout';
import { UserAvatar } from '@/components/UserAvatar';
import { profilePathForRole } from '@/lib/profilePaths';
import { cn } from '@/lib/utils';

type SidebarUserBlockProps = {
    roleLabel?: string;
    collapsed?: boolean;
};

export function SidebarUserBlock({ roleLabel, collapsed = false }: SidebarUserBlockProps) {
    const { t } = useTranslation();
    const user = useAppSelector((s) => s.auth.user);
    const handleLogout = useLogout();

    if (!user) return null;

    const displayRole =
        roleLabel ??
        user.role.charAt(0).toUpperCase() + user.role.slice(1);

    const profilePath = profilePathForRole(user.role);

    return (
        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link
                to={profilePath}
                title={collapsed ? user.name : undefined}
                className={cn(
                    'mb-3 flex items-center rounded-xl p-1 -mx-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
                    collapsed ? 'justify-center' : 'gap-3',
                )}
            >
                <UserAvatar user={user} className="h-10 w-10 shrink-0" />
                {!collapsed ? (
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {user.name}
                        </p>
                        <p className="truncate text-xs capitalize text-slate-400">{displayRole}</p>
                    </div>
                ) : null}
            </Link>
            <button
                type="button"
                onClick={handleLogout}
                title={collapsed ? t('common.logout') : undefined}
                className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20',
                    collapsed && 'px-2',
                )}
            >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed ? t('common.logout') : null}
            </button>
        </div>
    );
}
