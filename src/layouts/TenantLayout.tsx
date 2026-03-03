import { Link, useLocation, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, CreditCard, Wrench, FileText
} from 'lucide-react';

const TenantLayout = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Overview', path: '/tenant', icon: LayoutDashboard },
        { name: 'Lease', path: '/tenant/lease', icon: FileText },
        { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
        { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
            {/* Sidebar */}
            <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
                            AM
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Amani Mussa</p>
                            <p className="text-xs text-slate-400">Tenant</p>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || (item.path === '/tenant' && location.pathname === '/tenant');
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
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

export default TenantLayout;
