import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, LayoutGrid, PlusCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { showError, showSuccess } from '@/lib/toast';
import { useOwnerProperties, usePatchProperty } from '@/queries/property.queries';
import type { PropertySummary } from '@/schemas/property.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.05, duration: 0.25 } });

function thumb(p: PropertySummary): string {
    return (
        resolvePropertyImageUrl(p.primaryGalleryImagePath) ??
        `https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=100&seed=${p.id}`
    );
}

function statusBadge(status: PropertySummary['status']): string {
    switch (status) {
        case 'AVAILABLE':
            return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
        case 'DRAFT':
            return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
        case 'RENTED':
            return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300';
        case 'MAINTENANCE':
            return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
        case 'ARCHIVED':
            return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
        default:
            return 'bg-slate-100 dark:bg-slate-800 text-slate-600';
    }
}

const PropertyInventory = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const [query, setQuery] = useState('');

    const listQuery = useOwnerProperties({ page: 0, size: 100 });
    const patchPropertyMut = usePatchProperty();
    const rows = listQuery.data?.records ?? [];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                (p.propertyTypeName?.toLowerCase().includes(q) ?? false) ||
                String(p.id).includes(q),
        );
    }, [rows, query]);

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Property inventory</h1>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                        to={`${base}/properties/onboarding`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                        <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
                        New listing
                    </Link>
                    <Link
                        to={`${base}/visual-map`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                    >
                        <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                        Floor plans
                    </Link>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 sm:w-56 transition"
                        />
                    </div>
                </div>
            </div>

            {listQuery.isError ? (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                >
                    <p className="font-medium">Could not load your properties</p>
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
                                    {['Property', 'Location', 'Type', 'Status', 'Actions'].map((h) => (
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
                                            No properties yet.{' '}
                                            <Link
                                                to={`${base}/properties/onboarding`}
                                                className="font-semibold text-emerald-600 dark:text-emerald-400"
                                            >
                                                Create one
                                            </Link>
                                            .
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                                        <img src={thumb(p)} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {p.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                {p.location}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-500">
                                                {p.propertyTypeName ?? '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge(p.status)}`}
                                                >
                                                    {p.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Link
                                                        to={`${base}/visual-map?propertyId=${p.id}`}
                                                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                                    >
                                                        Maps
                                                    </Link>
                                                    {p.status === 'AVAILABLE' ? (
                                                        <Link
                                                            to={`/property/${p.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                                                        >
                                                            Live view
                                                            <ExternalLink className="h-3 w-3" aria-hidden />
                                                        </Link>
                                                    ) : p.status === 'DRAFT' ? (
                                                        <button
                                                            type="button"
                                                            disabled={patchPropertyMut.isPending}
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                                                            onClick={() =>
                                                                void (async () => {
                                                                    try {
                                                                        await patchPropertyMut.mutateAsync({
                                                                            id: p.id,
                                                                            patch: { status: 'AVAILABLE' },
                                                                        });
                                                                        showSuccess('Listing published — visible on Marketplace');
                                                                    } catch (e) {
                                                                        showError(
                                                                            e instanceof Error
                                                                                ? e.message
                                                                                : 'Could not publish',
                                                                        );
                                                                    }
                                                                })()
                                                            }
                                                        >
                                                            Publish to Marketplace
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">
                                                            Set status to AVAILABLE (edit listing) for public link
                                                        </span>
                                                    )}
                                                </div>
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

export default PropertyInventory;
