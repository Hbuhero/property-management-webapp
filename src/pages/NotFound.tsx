import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-4">
            <div className="mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                    <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-6xl font-bold text-slate-900 dark:text-white">404</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">Page not found</p>
                <p className="text-slate-500 dark:text-slate-500 mt-1 max-w-sm">
                    The page you're looking for doesn't exist or has been moved.
                </p>
            </div>
            <Link
                to="/"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
                Go Home
            </Link>
        </div>
    );
}
