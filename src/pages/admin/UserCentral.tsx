import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Settings, Trash2, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/hooks/useAppStore';
import { showError, showSuccess } from '@/lib/toast';
import {
    useAdminUsers,
    useDeleteAdminUser,
    useDisableAdminUser,
    useEnableAdminUser,
    useSuspendAdminUser,
} from '@/queries/adminUsers.queries';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.05, duration: 0.25 } });

function formatWhen(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function rolesLabel(roles: string[]): string {
    if (roles.length === 0) return '—';
    return roles.map((r) => r.replace(/_/g, ' ')).join(', ');
}

const UserCentral = () => {
    const [query, setQuery] = useState('');
    const selfId = useAppSelector((s) => s.auth.user?.id);
    const isSuperAdmin = useAppSelector((s) =>
        Boolean(s.auth.user?.backendRoles?.some((r) => r.toUpperCase() === 'SUPER_ADMIN')),
    );

    const usersQuery = useAdminUsers({
        page: 0,
        size: 100,
    });

    const rows = useMemo(() => usersQuery.data?.records ?? [], [usersQuery.data]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                rolesLabel(u.roles).toLowerCase().includes(q),
        );
    }, [rows, query]);

    const enableMut = useEnableAdminUser();
    const disableMut = useDisableAdminUser();
    const suspendMut = useSuspendAdminUser();
    const deleteMut = useDeleteAdminUser();

    const busy = enableMut.isPending || disableMut.isPending || suspendMut.isPending || deleteMut.isPending;

    const run = async (label: string, fn: () => Promise<unknown>) => {
        try {
            await fn();
            showSuccess(label);
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Action failed');
        }
    };

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 w-full sm:w-72 transition"
                    />
                </div>
            </div>

            {usersQuery.isError ? (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                >
                    <p className="font-medium">Could not load users</p>
                    <p className="mt-1 text-sm">
                        {usersQuery.error instanceof Error ? usersQuery.error.message : 'Unknown error'}
                    </p>
                    <button
                        type="button"
                        className="mt-4 rounded-lg bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900"
                        onClick={() => void usersQuery.refetch()}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[880px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {['User', 'Roles', 'Status', 'Updated', 'Actions'].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {usersQuery.isPending ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-slate-500">
                                            Loading…
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-slate-500">
                                            No users match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((user, i) => {
                                        const isSelf = selfId != null && String(user.id) === String(selfId);
                                        return (
                                            <motion.tr
                                                key={user.id}
                                                {...fadeUp}
                                                {...stagger(i)}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                            {user.name
                                                                .split(/\s+/)
                                                                .map((n) => n[0])
                                                                .slice(0, 2)
                                                                .join('')}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                                    {rolesLabel(user.roles)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            user.status === 'ACTIVE'
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                : user.status === 'SUSPENDED'
                                                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {user.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                                                    {formatWhen(user.updatedAt ?? user.createdAt)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <Link
                                                            to={`/admin/users/${user.id}`}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            title="Edit user"
                                                        >
                                                            <Settings className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            disabled={busy || isSelf || user.status === 'ACTIVE'}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            title="Activate"
                                                            onClick={() =>
                                                                void run('User enabled', () =>
                                                                    enableMut.mutateAsync(user.id),
                                                                )
                                                            }
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={busy || isSelf || user.status === 'DISABLED'}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                            title="Disable"
                                                            onClick={() =>
                                                                void run('User disabled', () =>
                                                                    disableMut.mutateAsync(user.id),
                                                                )
                                                            }
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={busy || isSelf || user.status === 'SUSPENDED'}
                                                            className="p-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-700 disabled:opacity-40 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-2 rounded-lg"
                                                            title="Suspend"
                                                            onClick={() =>
                                                                void run('User suspended', () =>
                                                                    suspendMut.mutateAsync(user.id),
                                                                )
                                                            }
                                                        >
                                                            Suspend
                                                        </button>
                                                        {isSuperAdmin ? (
                                                            <button
                                                                type="button"
                                                                disabled={busy || isSelf}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                title="Delete permanently"
                                                                onClick={() => {
                                                                    if (
                                                                        !window.confirm(
                                                                            `Permanently delete ${user.email}? This cannot be undone.`,
                                                                        )
                                                                    ) {
                                                                        return;
                                                                    }
                                                                    void run('User deleted', () =>
                                                                        deleteMut.mutateAsync(user.id),
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default UserCentral;
