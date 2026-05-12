import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminProperties } from '@/queries/adminProperties.queries';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.05, duration: 0.25 } });

function formatWhen(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

const AdminProperties = () => {
    const [query, setQuery] = useState('');
    const listQuery = useAdminProperties({ page: 0, size: 100 });

    const filtered = useMemo(() => {
        const rows = listQuery.data?.records ?? [];
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                (p.ownerFullName?.toLowerCase().includes(q) ?? false) ||
                String(p.id).includes(q),
        );
    }, [listQuery.data?.records, query]);

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Properties</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Full catalog (admin). Tenant-facing marketplace only lists AVAILABLE listings.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search title, location, owner, id…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 w-full sm:w-72 transition"
                    />
                </div>
            </div>

            {listQuery.isError ? (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                >
                    <p className="font-medium">Could not load properties</p>
                    <p className="mt-1 text-sm">
                        {listQuery.error instanceof Error ? listQuery.error.message : 'Unknown error'}
                    </p>
                    <button
                        type="button"
                        className="mt-4 rounded-lg bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900"
                        onClick={() => void listQuery.refetch()}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[720px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {['Property', 'Status', 'Owner', 'Updated', ''].map((h) => (
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
                                {listQuery.isPending ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-slate-500">
                                            Loading…
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-slate-500">
                                            No properties match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((p, i) => (
                                        <motion.tr
                                            key={p.id}
                                            {...fadeUp}
                                            {...stagger(i)}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {p.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">{p.location}</p>
                                                {p.propertyTypeName ? (
                                                    <p className="text-[11px] text-slate-500 mt-1">
                                                        {p.propertyTypeName}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                    {p.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {p.ownerFullName ?? '—'}
                                                {p.ownerId != null ? (
                                                    <span className="block text-[11px] text-slate-400">
                                                        ID {p.ownerId}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                                                {formatWhen(p.updatedAt)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/property/${p.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                                >
                                                    View
                                                    <ExternalLink className="h-3 w-3" aria-hidden />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminProperties;
