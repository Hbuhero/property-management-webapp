import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/hooks/useAppStore';
import { showError, showSuccess } from '@/lib/toast';
import { useAdminUser, useUpdateAdminUser } from '@/queries/adminUsers.queries';
import type { AdminUserRow } from '@/schemas/adminUser.schema';

const BACKEND_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER', 'TENANT', 'LAND_LORD'] as const;

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200';

function AdminUserEditForm({
    userId,
    user,
    canEditRole,
}: {
    userId: string;
    user: AdminUserRow;
    canEditRole: boolean;
}) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phoneNumber);
    const [role, setRole] = useState<string>(user.roles[0] ?? 'USER');
    const updateMut = useUpdateAdminUser();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await updateMut.mutateAsync({
                id: userId,
                body: {
                    name: name.trim(),
                    email: email.trim(),
                    phoneNumber: phone.trim(),
                    role,
                },
            });
            showSuccess('User updated');
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Update failed');
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <label className={labelClass}>
                Full name
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className={labelClass}>
                Email
                <input
                    className={inputClass}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </label>
            <label className={labelClass}>
                Phone
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label className={labelClass}>
                Primary role (backend)
                <select
                    className={inputClass}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={!canEditRole}
                >
                    {BACKEND_ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
                {!canEditRole ? (
                    <span className="mt-1 block text-xs text-slate-400">
                        Only admins can change roles; you cannot change your own role here.
                    </span>
                ) : null}
            </label>

            <button
                type="submit"
                disabled={updateMut.isPending}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
                {updateMut.isPending ? 'Saving…' : 'Save changes'}
            </button>
        </form>
    );
}

const AdminUserDetail = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const selfId = useAppSelector((s) => s.auth.user?.id);
    const isAdmin = useAppSelector((s) =>
        Boolean(
            s.auth.user?.backendRoles?.some((r) => {
                const u = r.toUpperCase();
                return u === 'ADMIN' || u === 'SUPER_ADMIN';
            }),
        ),
    );

    const detailQuery = useAdminUser(userId);

    if (detailQuery.isPending) {
        return (
            <div className="py-16">
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading user…</p>
            </div>
        );
    }

    if (detailQuery.isError || !detailQuery.data) {
        return (
            <div className="py-16 space-y-4">
                <p className="text-slate-900 dark:text-white font-medium">User not found.</p>
                <Link to="/admin/users" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Back to users
                </Link>
            </div>
        );
    }

    const user = detailQuery.data;
    const isSelf = selfId != null && String(user.id) === String(selfId);
    const canEditRole = isAdmin && !isSelf;

    return (
        <motion.div {...fadeUp} className="max-w-xl space-y-8">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-500 hover:text-emerald-600 text-sm font-medium dark:text-slate-400"
            >
                <ChevronLeft className="h-4 w-4 mr-0.5" aria-hidden />
                Back
            </button>

            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit user</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
            </div>

            <AdminUserEditForm
                key={String(user.id)}
                userId={String(user.id)}
                user={user}
                canEditRole={canEditRole}
            />

            <p className="text-xs text-slate-400 dark:text-slate-500">
                Status changes (enable / disable / suspend) are on the{' '}
                <Link to="/admin/users" className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    user list
                </Link>
                .
            </p>
        </motion.div>
    );
};

export default AdminUserDetail;
