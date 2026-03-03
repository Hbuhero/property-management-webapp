import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '@/helper/require-auth'
import GeneralError from '@/pages/errors/GeneralError'

const router = createBrowserRouter([

    // ── Public routes (all share the Navbar via PublicLayout) ──────────────────
    {
        lazy: async () => {
            const { PublicLayout } = await import('./layouts/PublicLayout')
            return { Component: PublicLayout }
        },
        children: [
            {
                path: '/',
                lazy: async () => ({
                    Component: (await import('./pages/LandingPage')).default,
                }),
            },
            {
                path: '/marketplace',
                lazy: async () => ({
                    Component: (await import('./pages/MarketPlace')).default,
                }),
            },
            {
                path: '/login',
                lazy: async () => ({
                    Component: (await import('./pages/LoginPage')).default,
                }),
            },
            {
                path: '/property/:id',
                lazy: async () => ({
                    Component: (await import('./pages/PropertyDetail')).default,
                }),
            },
        ],
    },


    // ── Protected routes (all roles) ───────────────────────────────────────────
    {
        element: <RequireAuth />,
        children: [

            // ── Admin dashboard ─────────────────────────────────────────────────
            {
                path: '/admin',
                lazy: async () => {
                    const { default: AdminLayout } = await import('./layouts/AdminLayout')
                    return { Component: AdminLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/admin/SystemHealth')).default,
                        }),
                    },
                    {
                        path: 'users',
                        lazy: async () => ({
                            Component: (await import('./pages/admin/UserCentral')).default,
                        }),
                    },
                    {
                        path: 'security',
                        lazy: async () => ({
                            Component: (await import('./pages/admin/SecurityLogs')).default,
                        }),
                    },
                ],
            },

            // ── Tenant dashboard ────────────────────────────────────────────────
            {
                path: '/tenant',
                lazy: async () => {
                    const { default: TenantLayout } = await import('./layouts/TenantLayout')
                    return { Component: TenantLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/tenant/TenantOverview')).default,
                        }),
                    },
                    {
                        path: 'lease',
                        lazy: async () => ({
                            Component: (await import('./pages/tenant/LeaseManagement')).default,
                        }),
                    },
                    {
                        path: 'payments',
                        lazy: async () => ({
                            Component: (await import('./pages/tenant/PaymentHub')).default,
                        }),
                    },
                    {
                        path: 'maintenance',
                        lazy: async () => ({
                            Component: (await import('./pages/tenant/MaintenancePortal')).default,
                        }),
                    },
                ],
            },

            // ── Owner / Landlord dashboard ──────────────────────────────────────
            {
                path: '/owner',
                lazy: async () => {
                    const { default: OwnerLayout } = await import('./layouts/OwnerLayout')
                    return { Component: OwnerLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/owner/OwnerOverview')).default,
                        }),
                    },
                    {
                        path: 'properties',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/PropertyInventory')).default,
                        }),
                    },
                    {
                        path: 'applications',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/ApplicationInbox')).default,
                        }),
                    },
                    {
                        path: 'finances',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/FinancialReports')).default,
                        }),
                    },
                ],
            },
            {
                path: '/landlord',
                lazy: async () => {
                    const { default: OwnerLayout } = await import('./layouts/OwnerLayout')
                    return { Component: OwnerLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/owner/OwnerOverview')).default,
                        }),
                    },
                    {
                        path: 'properties',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/PropertyInventory')).default,
                        }),
                    },
                    {
                        path: 'applications',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/ApplicationInbox')).default,
                        }),
                    },
                    {
                        path: 'finances',
                        lazy: async () => ({
                            Component: (await import('./pages/owner/FinancialReports')).default,
                        }),
                    },
                ],
            },

        ],
    },

    // ── Fallback 404 ───────────────────────────────────────────────────────────
    {
        path: '*',
        lazy: async () => ({
            Component: (await import('./pages/NotFound')).default,
        }),
    },
])

export default router
