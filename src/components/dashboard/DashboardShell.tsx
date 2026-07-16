import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Menu } from 'lucide-react';
import { DashboardPublicBar } from '@/components/dashboard/DashboardPublicBar';
import { DashboardSidebarHeader } from '@/components/dashboard/DashboardSidebarHeader';
import { SidebarUserBlock } from '@/components/dashboard/SidebarUserBlock';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { cn } from '@/lib/utils';
import { toggleSidebar } from '@/store/slices/uiSlice';

export type DashboardNavItem = {
    name: string;
    path: string;
    icon: LucideIcon;
    match?: 'exact' | 'prefix';
    external?: boolean;
    isActive?: (pathname: string) => boolean;
};

type DashboardShellProps = {
    navItems: DashboardNavItem[];
    roleLabel?: string;
};

function defaultIsActive(pathname: string, item: DashboardNavItem): boolean {
    if (item.isActive) return item.isActive(pathname);
    const mode = item.match ?? 'prefix';
    if (mode === 'exact') {
        return pathname === item.path || pathname === `${item.path}/`;
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function DashboardShell({ navItems, roleLabel }: DashboardShellProps) {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleSidebarToggle = () => {
        if (window.matchMedia('(max-width: 767px)').matches) {
            setMobileOpen((open) => !open);
            return;
        }
        dispatch(toggleSidebar());
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 transition-colors duration-200 dark:bg-slate-950">
            {mobileOpen ? (
                <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-900 md:relative md:z-auto md:translate-x-0',
                    collapsed ? 'w-[4.5rem]' : 'w-60',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
                )}
            >
                <DashboardSidebarHeader collapsed={collapsed} onToggle={handleSidebarToggle} />
                <div className="flex min-h-0 flex-1 flex-col p-3">
                    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = !item.external && defaultIsActive(location.pathname, item);
                            const className = cn(
                                'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                                active
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                            );

                            const content = (
                                <>
                                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                    {!collapsed ? <span className="truncate">{item.name}</span> : null}
                                </>
                            );

                            if (item.external) {
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={className}
                                        title={collapsed ? item.name : undefined}
                                    >
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={className}
                                    title={collapsed ? item.name : undefined}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                    </nav>
                    <SidebarUserBlock roleLabel={roleLabel} collapsed={collapsed} />
                </div>
            </aside>

            <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="mb-6 flex items-center gap-2 md:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                        <Menu className="h-5 w-5" aria-hidden />
                    </button>
                </div>
                <DashboardPublicBar />
                <Outlet />
            </main>
        </div>
    );
}
