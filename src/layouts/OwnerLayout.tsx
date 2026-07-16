import { useLocation } from 'react-router-dom';
import {
    BarChart3,
    Building,
    Wallet,
    FileText,
    LayoutGrid,
    ShoppingBag,
    Wrench,
} from 'lucide-react';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

function navActive(pathname: string, itemPath: string, mode: 'exact' | 'prefix'): boolean {
    if (mode === 'exact') {
        return pathname === itemPath || pathname === `${itemPath}/`;
    }
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

const OwnerLayout = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';

    const navItems: DashboardNavItem[] = [
        {
            name: 'Overview',
            path: base,
            icon: BarChart3,
            match: 'exact',
            isActive: (pathname) => navActive(pathname, base, 'exact'),
        },
        {
            name: 'Properties',
            path: `${base}/properties`,
            icon: Building,
            match: 'prefix',
            isActive: (pathname) => navActive(pathname, `${base}/properties`, 'prefix'),
        },
        {
            name: 'Floor plans',
            path: `${base}/visual-map`,
            icon: LayoutGrid,
            match: 'prefix',
            isActive: (pathname) => navActive(pathname, `${base}/visual-map`, 'prefix'),
        },
        {
            name: 'Applications',
            path: `${base}/applications`,
            icon: FileText,
            match: 'exact',
            isActive: (pathname) => navActive(pathname, `${base}/applications`, 'exact'),
        },
        {
            name: 'Maintenance',
            path: `${base}/maintenance`,
            icon: Wrench,
            match: 'exact',
            isActive: (pathname) => navActive(pathname, `${base}/maintenance`, 'exact'),
        },
        {
            name: 'Finances',
            path: `${base}/finances`,
            icon: Wallet,
            match: 'prefix',
            isActive: (pathname) => navActive(pathname, `${base}/finances`, 'prefix'),
        },
        { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, match: 'exact', external: true },
    ];

    return <DashboardShell navItems={navItems} roleLabel="Landlord" />;
};

export default OwnerLayout;
