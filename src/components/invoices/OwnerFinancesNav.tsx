import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function OwnerFinancesNav() {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const reportsPath = `${base}/finances`;
    const leasesPath = `${base}/finances/active-leases`;

    const tabClass = (active: boolean) =>
        cn(
            'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
            active
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        );

    return (
        <div className="inline-flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950">
            <Link to={reportsPath} className={tabClass(location.pathname === reportsPath)}>
                Reports
            </Link>
            <Link
                to={leasesPath}
                className={tabClass(location.pathname === leasesPath)}
            >
                Active leases
            </Link>
        </div>
    );
}
