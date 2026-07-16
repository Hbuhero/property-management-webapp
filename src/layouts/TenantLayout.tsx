import { LayoutDashboard, CreditCard, Wrench, FileText, ShoppingBag } from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

const TenantLayout = () => {
    const navItems: DashboardNavItem[] = [
        {
            name: 'Overview',
            path: '/tenant',
            icon: LayoutDashboard,
            match: 'exact',
            isActive: (pathname) => pathname === '/tenant',
        },
        {
            name: 'Lease',
            path: '/tenant/lease',
            icon: FileText,
            isActive: (pathname) =>
                pathname === '/tenant/lease' || pathname.startsWith('/tenant/lease/'),
        },
        {
            name: 'Payments',
            path: '/tenant/payments',
            icon: CreditCard,
            isActive: (pathname) =>
                pathname === '/tenant/payments' || pathname.startsWith('/tenant/payments/'),
        },
        {
            name: 'Maintenance',
            path: '/tenant/maintenance',
            icon: Wrench,
            isActive: (pathname) =>
                pathname === '/tenant/maintenance' || pathname.startsWith('/tenant/maintenance/'),
        },
        { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, external: true },
    ];

    return <DashboardShell navItems={navItems} roleLabel="Tenant" />;
};

export default TenantLayout;
