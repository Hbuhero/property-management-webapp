import { Link } from 'react-router-dom';
import { Globe, ShoppingBag } from 'lucide-react';

export function DashboardPublicBar() {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-2">
            <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
            >
                <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                Marketplace
            </Link>
            <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
                <Globe className="h-4 w-4 shrink-0" aria-hidden />
                Website home
            </Link>
        </div>
    );
}
