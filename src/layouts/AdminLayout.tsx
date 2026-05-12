import { Link, useLocation, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    ShieldAlert,
    Users,
    Activity,
    ShieldCheck,
    Building2,
    ShoppingBag,
} from 'lucide-react';

type NavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
    match: 'exact' | 'prefix';
    external?: boolean;
};

const navItems: NavItem[] = [
    { name: 'System Health', path: '/admin', icon: Activity, match: 'exact' },
    { name: 'Users', path: '/admin/users', icon: Users, match: 'prefix' },
    { name: 'Properties', path: '/admin/properties', icon: Building2, match: 'prefix' },
    { name: 'Security', path: '/admin/security', icon: ShieldAlert, match: 'exact' },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, match: 'exact', external: true },
];

function isNavActive(pathname: string, item: NavItem): boolean {
    if (item.match === 'exact') {
        return pathname === item.path || pathname === `${item.path}/`;
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

const AdminLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
            <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">System Admin</p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wide">
                                ADMIN
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isNavActive(location.pathname, item);
                            const className = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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
                                        className={className}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {item.name}
                                    </Link>
                                );
                            }

                            return (
                                <Link key={item.path} to={item.path} className={className}>
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

export default AdminLayout;
