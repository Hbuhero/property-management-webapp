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
                path: '/admin/*',
                lazy: async () => {
                    const { DashboardLayout } = await import('./layouts/DashboardLayout')
                    return { Component: DashboardLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/AdminDashboard')).default,
                        }),
                    },
                ],
            },

            // ── Tenant dashboard ────────────────────────────────────────────────
            {
                path: '/tenant/*',
                lazy: async () => {
                    const { DashboardLayout } = await import('./layouts/DashboardLayout')
                    return { Component: DashboardLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/TenantDashboard')).default,
                        }),
                    },
                ],
            },

            // ── Owner / Landlord dashboard ──────────────────────────────────────
            {
                path: '/owner/*',
                lazy: async () => {
                    const { DashboardLayout } = await import('./layouts/DashboardLayout')
                    return { Component: DashboardLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/OwnerDashboard')).default,
                        }),
                    },
                ],
            },
            {
                path: '/landlord/*',
                lazy: async () => {
                    const { DashboardLayout } = await import('./layouts/DashboardLayout')
                    return { Component: DashboardLayout }
                },
                errorElement: <GeneralError />,
                children: [
                    {
                        index: true,
                        lazy: async () => ({
                            Component: (await import('./pages/OwnerDashboard')).default,
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
