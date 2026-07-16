import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppSelector } from '@/hooks/useAppStore';
import { profilePathForRole } from '@/lib/profilePaths';

export function ProfileTopLink() {
    const { t } = useTranslation();
    const user = useAppSelector((s) => s.auth.user);

    if (!user) return null;

    return (
        <Link
            to={profilePathForRole(user.role)}
            aria-label={t('common.profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
        >
            <UserAvatar user={user} className="h-7 w-7 shrink-0" />
            <span className="hidden sm:inline max-w-[10rem] truncate">{user.name}</span>
        </Link>
    );
}
