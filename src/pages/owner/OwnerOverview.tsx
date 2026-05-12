import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, LayoutGrid, PlusCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOwnerProperties } from '@/queries/property.queries';
import type { PropertyStatus } from '@/schemas/property.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.06, duration: 0.28 } });

function statusLabel(s: PropertyStatus): string {
    return s.replace(/_/g, ' ');
}

const OwnerOverview = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';

    const propsQuery = useOwnerProperties({ page: 0, size: 100 });
    const rows = useMemo(() => propsQuery.data?.records ?? [], [propsQuery.data]);

    const total = rows.length;
    const byStatus = useMemo(() => {
        const m = new Map<PropertyStatus, number>();
        for (const p of rows) {
            m.set(p.status, (m.get(p.status) ?? 0) + 1);
        }
        return m;
    }, [rows]);

    const statusRows = useMemo(() => {
        const order: PropertyStatus[] = [
            'AVAILABLE',
            'DRAFT',
            'RENTED',
            'MAINTENANCE',
            'ARCHIVED',
        ];
        return order.filter((s) => (byStatus.get(s) ?? 0) > 0).map((s) => ({
            status: s,
            count: byStatus.get(s) ?? 0,
        }));
    }, [byStatus]);

    const kpis = [
        {
            label: 'Your listings',
            value: propsQuery.isPending ? '…' : String(total),
            hint: 'Non-deleted properties you own',
        },
        {
            label: 'Published (AVAILABLE)',
            value: propsQuery.isPending ? '…' : String(byStatus.get('AVAILABLE') ?? 0),
            hint: 'Shown on marketplace',
        },
        {
            label: 'Drafts',
            value: propsQuery.isPending ? '…' : String(byStatus.get('DRAFT') ?? 0),
            hint: 'Finish onboarding & set AVAILABLE',
        },
    ];

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Properties tied to your account</p>
                </div>
                <Link
                    to={`${base}/properties/onboarding`}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/20"
                >
                    <PlusCircle className="h-4 w-4" aria-hidden />
                    New listing
                </Link>
            </div>

            {propsQuery.isError ? (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                >
                    {propsQuery.error instanceof Error ? propsQuery.error.message : 'Could not load properties'}
                </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {kpis.map((k, i) => (
                    <motion.div
                        key={k.label}
                        {...fadeUp}
                        {...stagger(i)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl"
                    >
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{k.label}</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{k.value}</h3>
                        <p className="text-[11px] text-slate-400 mt-2">{k.hint}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    {...fadeUp}
                    {...stagger(4)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl"
                >
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Status breakdown</h3>
                    {propsQuery.isPending ? (
                        <p className="text-sm text-slate-500">Loading…</p>
                    ) : statusRows.length === 0 ? (
                        <p className="text-sm text-slate-500">No properties yet — start with a new listing.</p>
                    ) : (
                        <ul className="space-y-3">
                            {statusRows.map(({ status, count }) => (
                                <li key={status} className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        {statusLabel(status)}
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link
                        to={`${base}/properties`}
                        className="mt-6 flex items-center justify-center w-full py-2.5 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                        View inventory
                    </Link>
                </motion.div>

                <motion.div
                    {...fadeUp}
                    {...stagger(5)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3"
                >
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Shortcuts</h3>
                    <Link
                        to={`${base}/visual-map`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 transition-colors"
                    >
                        <LayoutGrid className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                        Floor plans &amp; overlays
                    </Link>
                    <Link
                        to="/marketplace"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 transition-colors"
                    >
                        <ShoppingBag className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                        Public marketplace (new tab)
                    </Link>
                    <Link
                        to={`${base}/properties`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 transition-colors"
                    >
                        <Building2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                        Manage listings
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default OwnerOverview;
