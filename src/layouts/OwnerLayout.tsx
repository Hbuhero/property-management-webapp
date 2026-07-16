import { Link, useLocation, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Building,
    Wallet,
    FileText,
    LayoutGrid,
    ShoppingBag,
    Wrench,
} from 'lucide-react';
import { DashboardPublicBar } from '@/components/dashboard/DashboardPublicBar';
import { SidebarUserBlock } from '@/components/dashboard/SidebarUserBlock';

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

    const navItems: NavItem[] = [
        { name: 'Overview', path: base, icon: BarChart3, match: 'exact' },
        { name: 'Properties', path: `${base}/properties`, icon: Building, match: 'prefix' },
        { name: 'Floor plans', path: `${base}/visual-map`, icon: LayoutGrid, match: 'prefix' },
        { name: 'Applications', path: `${base}/applications`, icon: FileText, match: 'exact' },
        { name: 'Maintenance', path: `${base}/maintenance`, icon: Wrench, match: 'exact' },
        { name: 'Finances', path: `${base}/finances`, icon: Wallet, match: 'prefix' },
        { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, match: 'exact', external: true },
    ];

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden transition-colors duration-200">
            <aside className="w-60 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-6 flex flex-col flex-1 min-h-0">
                    <nav className="space-y-1 flex-1">
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
                                    <Link key={item.path} to={item.path} className={cls}>
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
                    <SidebarUserBlock roleLabel="Landlord" />
                </div>
            </aside>

            <main className="flex-1 min-h-0 p-6 lg:p-8 overflow-y-auto">
                <DashboardPublicBar />
                <Outlet />
            </main>
        </div>
    );
};

export default OwnerLayout;
