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
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

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

const adminNav: DashboardNavItem[] = navItems.map((item) => ({
    ...item,
    isActive: (pathname) => isNavActive(pathname, item),
}));

const AdminLayout = () => {
    return <DashboardShell navItems={adminNav} roleLabel="Admin" />;
};

export default AdminLayout;
