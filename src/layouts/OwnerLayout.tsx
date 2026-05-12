import { Link, useLocation, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Building,
    Wallet,
    FileText,
    LayoutGrid,
    ShoppingBag,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppStore';

type NavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
    match: 'exact' | 'prefix';
    external?: boolean;
};

function navActive(pathname: string, itemPath: string, mode: 'exact' | 'prefix'): boolean {
    if (mode === 'exact') {
        return pathname === itemPath || pathname === `${itemPath}/`;
    }
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

const OwnerLayout = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const user = useAppSelector((s) => s.auth.user);

    const navItems: NavItem[] = [
        { name: 'Overview', path: base, icon: BarChart3, match: 'exact' },
        { name: 'Properties', path: `${base}/properties`, icon: Building, match: 'prefix' },
        { name: 'Floor plans', path: `${base}/visual-map`, icon: LayoutGrid, match: 'prefix' },
        { name: 'Applications', path: `${base}/applications`, icon: FileText, match: 'exact' },
        { name: 'Finances', path: `${base}/finances`, icon: Wallet, match: 'exact' },
        { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, match: 'exact', external: true },
    ];

    const initial = user?.name?.trim()?.split(/\s+/)?.map((w) => w[0])?.slice(0, 2)?.join('') ?? 'PM';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
            <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {initial.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {user?.name ?? 'Landlord'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = navActive(location.pathname, item.path, item.match);
                            const cls = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                active
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`;

                            if (item.external) {
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={cls}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            }

                            return (
                                <Link key={item.path} to={item.path} className={cls}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default OwnerLayout;
