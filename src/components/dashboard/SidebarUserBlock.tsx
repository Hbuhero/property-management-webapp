import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppStore';
import { useLogout } from '@/hooks/useLogout';
import { UserAvatar } from '@/components/UserAvatar';
import { profilePathForRole } from '@/lib/profilePaths';

type SidebarUserBlockProps = {
    roleLabel?: string;
};

export function SidebarUserBlock({ roleLabel }: SidebarUserBlockProps) {
    const { t } = useTranslation();
    const user = useAppSelector((s) => s.auth.user);
    const handleLogout = useLogout();

    if (!user) return null;

    const displayRole =
        roleLabel ??
        user.role.charAt(0).toUpperCase() + user.role.slice(1);

    const profilePath = profilePathForRole(user.role);

    return (
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
                to={profilePath}
                className="mb-3 flex items-center gap-3 rounded-xl p-1 -mx-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <UserAvatar user={user} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate capitalize">{displayRole}</p>
                </div>
            </Link>
            <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                {t('common.logout')}
            </button>
        </div>
    );
}
