import { Link } from 'react-router-dom';
import { Mail, Phone, Shield, Calendar, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '@/components/UserAvatar';
import { useAppSelector } from '@/hooks/useAppStore';
import { editProfilePathForRole } from '@/lib/profilePaths';
import { useProfile } from '@/queries/profile.queries';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

function formatMemberSince(value: string | number[] | undefined): string {
    if (value == null) return '—';
    if (Array.isArray(value)) {
        const [y, m = 1, d = 1] = value;
        const date = new Date(y, m - 1, d);
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function statusBadgeClass(status: string): string {
    const s = status.toUpperCase();
    if (s === 'ACTIVE') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (s === 'PENDING') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
    if (s === 'SUSPENDED') {
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function formatRoleLabel(role: string): string {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfilePage() {
    const { t } = useTranslation();
    const authUser = useAppSelector((s) => s.auth.user);
    const { data: profile, isLoading, isError } = useProfile();

    const editPath = authUser ? editProfilePathForRole(authUser.role) : '/';

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="max-w-2xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {t('profile.loadError')}
            </div>
        );
    }

    const displayUser = {
        name: profile.name,
        avatar: profile.image ?? authUser?.avatar,
    };

    return (
        <motion.div className="max-w-2xl mx-auto" {...fadeUp}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('profile.title')}</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('profile.subtitle')}</p>
                </div>
                <Link
                    to={editPath}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-700"
                >
                    <Pencil className="h-4 w-4" aria-hidden />
                    {t('profile.editProfile')}
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-8 dark:border-slate-800 dark:from-emerald-950/30 dark:to-slate-900">
                    <div className="flex flex-wrap items-center gap-5">
                        <UserAvatar user={displayUser} className="h-20 w-20 text-lg" />
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                {profile.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">
                                {profile.email}
                            </p>
                            <span
                                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(profile.status)}`}
                            >
                                {profile.status}
                            </span>
                        </div>
                    </div>
                </div>

                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex items-start gap-3 px-6 py-4">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {t('common.email')}
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">{profile.email}</dd>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 px-6 py-4">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {t('auth.phone')}
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {profile.phoneNumber?.trim() || '—'}
                            </dd>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 px-6 py-4">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {t('profile.roles')}
                            </dt>
                            <dd className="mt-2 flex flex-wrap gap-2">
                                {profile.roles.map((role) => (
                                    <span
                                        key={role}
                                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        {formatRoleLabel(role)}
                                    </span>
                                ))}
                            </dd>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 px-6 py-4">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {t('profile.memberSince')}
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                                {formatMemberSince(profile.createdAt)}
                            </dd>
                        </div>
                    </div>
                </dl>
            </div>
        </motion.div>
    );
}
