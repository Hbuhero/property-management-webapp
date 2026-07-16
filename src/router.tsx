import { createBrowserRouter } from 'react-router-dom'
import RequireAuth from '@/helper/require-auth'
import RequireRole from '@/helper/require-role'
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
                path: '/register',
                lazy: async () => ({
                    Component: (await import('./pages/RegisterPage')).default,
                }),
            },
            {
                path: '/check-email',
                lazy: async () => ({
                    Component: (await import('./pages/CheckEmailPage')).default,
                }),
            },
            {
                path: '/activate-account',
                lazy: async () => ({
                    Component: (await import('./pages/ActivateAccountPage')).default,
                }),
            },
            {
                path: '/verify-email',
                lazy: async () => ({
                    Component: (await import('./pages/ActivateAccountPage')).default,
                }),
            },
            {
                path: '/property/:id',
                lazy: async () => ({
                    Component: (await import('./pages/PropertyDetail')).default,
                }),
            },
            {
                path: '/floors/:floorId/map',
                lazy: async () => ({
                    Component: (await import('./pages/FloorMapPage')).default,
                }),
            },
        ],
    },


    // ── Protected routes (all roles) ───────────────────────────────────────────
    // Path prefixes `/admin`, `/tenant`, `/owner`, `/landlord` match `ROLE_HOME` in `src/lib/authRole.ts`.
    {
        element: <RequireAuth />,
        children: [

            // ── Admin dashboard ─────────────────────────────────────────────────
            {
                path: '/admin',
                element: <RequireRole allowedRoles={['admin']} />,
                children: [
                    {
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
                                path: 'properties',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/AdminProperties')).default,
                                }),
                            },
                            {
                                path: 'property-types',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/AdminPropertyTypes')).default,
                                }),
                            },
                            {
                                path: 'locations',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/AdminLocations')).default,
                                }),
                            },
                            {
                                path: 'profile/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/EditProfilePage')).default,
                                }),
                            },
                            {
                                path: 'profile',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/ProfilePage')).default,
                                }),
                            },
                            {
                                path: 'users/:userId',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/AdminUserDetail')).default,
                                }),
                            },
                            {
                                path: 'users',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/UserCentral')).default,
                                }),
                            },
                            {
                                path: 'reports',
                                lazy: async () => ({
                                    Component: (await import('./pages/admin/AdminReports')).default,
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
                ],
            },

            // ── Tenant dashboard ────────────────────────────────────────────────
            {
                path: '/tenant',
                element: <RequireRole allowedRoles={['tenant']} />,
                children: [
                    {
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
                                path: 'lease/:applicationId',
                                lazy: async () => ({
                                    Component: (await import('./pages/tenant/TenantApplicationDetail')).default,
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
                            {
                                path: 'profile',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/ProfilePage')).default,
                                }),
                            },
                            {
                                path: 'profile/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/EditProfilePage')).default,
                                }),
                            },
                        ],
                    },
                ],
            },

            // ── Owner / Landlord dashboard ──────────────────────────────────────
            {
                path: '/owner',
                element: <RequireRole allowedRoles={['owner', 'landlord']} />,
                children: [
                    {
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
                                path: 'properties/onboarding',
                                lazy: async () => ({
                                    Component: (await import('./features/property-onboarding/PropertyOnboardingWizard'))
                                        .default,
                                }),
                            },
                            {
                                path: 'properties/:propertyId/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/PropertyEditPage')).default,
                                }),
                            },
                            {
                                path: 'visual-map',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/VisualMapOwner')).default,
                                }),
                            },
                            {
                                path: 'applications',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ApplicationInbox')).default,
                                }),
                            },
                            {
                                path: 'applications/:applicationId',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ApplicationDetail')).default,
                                }),
                            },
                            {
                                path: 'maintenance',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/MaintenanceQueue')).default,
                                }),
                            },
                            {
                                path: 'finances',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/FinancialReports')).default,
                                }),
                            },
                            {
                                path: 'finances/active-leases',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ActiveLeases')).default,
                                }),
                            },
                            {
                                path: 'profile',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/ProfilePage')).default,
                                }),
                            },
                            {
                                path: 'profile/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/EditProfilePage')).default,
                                }),
                            },
                        ],
                    },
                ],
            },
            {
                path: '/landlord',
                element: <RequireRole allowedRoles={['owner', 'landlord']} />,
                children: [
                    {
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
                                path: 'properties/onboarding',
                                lazy: async () => ({
                                    Component: (await import('./features/property-onboarding/PropertyOnboardingWizard'))
                                        .default,
                                }),
                            },
                            {
                                path: 'properties/:propertyId/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/PropertyEditPage')).default,
                                }),
                            },
                            {
                                path: 'visual-map',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/VisualMapOwner')).default,
                                }),
                            },
                            {
                                path: 'applications',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ApplicationInbox')).default,
                                }),
                            },
                            {
                                path: 'applications/:applicationId',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ApplicationDetail')).default,
                                }),
                            },
                            {
                                path: 'maintenance',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/MaintenanceQueue')).default,
                                }),
                            },
                            {
                                path: 'finances',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/FinancialReports')).default,
                                }),
                            },
                            {
                                path: 'finances/active-leases',
                                lazy: async () => ({
                                    Component: (await import('./pages/owner/ActiveLeases')).default,
                                }),
                            },
                            {
                                path: 'profile',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/ProfilePage')).default,
                                }),
                            },
                            {
                                path: 'profile/edit',
                                lazy: async () => ({
                                    Component: (await import('./pages/profile/EditProfilePage')).default,
                                }),
                            },
                        ],
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
