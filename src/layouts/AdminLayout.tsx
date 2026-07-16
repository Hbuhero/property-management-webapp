import { Link, useLocation, Outlet } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    ShieldAlert,
    Users,
    Activity,
    Building2,
    ShoppingBag,
    FileBarChart,
    Tag,
    MapPin,
} from 'lucide-react';
import { SidebarUserBlock } from '@/components/dashboard/SidebarUserBlock';
import { DashboardPublicBar } from '@/components/dashboard/DashboardPublicBar';

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
    { name: 'Property types', path: '/admin/property-types', icon: Tag, match: 'exact' },
    { name: 'Locations', path: '/admin/locations', icon: MapPin, match: 'exact' },
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart, match: 'exact' },
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
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden transition-colors duration-200">
            <aside className="w-60 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-6 flex flex-col flex-1 min-h-0">
                    <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto">
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
                    <SidebarUserBlock roleLabel="Admin" />
                </div>
            </aside>

            <main className="flex-1 min-h-0 p-6 lg:p-8 overflow-y-auto">
                <DashboardPublicBar />
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
