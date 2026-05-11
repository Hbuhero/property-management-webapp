import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

/**
 * Wraps all public-facing pages (Landing, Marketplace, PropertyDetail, floor map, Login, Register, email verification)
 * with the top Navbar.
 */
export function PublicLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    )
}
