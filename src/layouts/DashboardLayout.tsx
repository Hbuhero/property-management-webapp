import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, User, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppStore';
import { logout } from '@/store/slices/authSlice';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { showSuccess } from '@/lib/toast';

export function DashboardLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useAppSelector((state) => state.auth.user);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        showSuccess(t('auth.logoutSuccess'));
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight whitespace-nowrap hidden sm:block">
                        Makazi<span className="text-emerald-600 dark:text-emerald-400">Hub</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            className="flex items-center gap-0 sm:gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 sm:pr-3 rounded-full transition-colors"
                        >
                            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                                {user?.name || 'User'}
                            </span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                                <div className="px-4 py-3 mb-1 border-b border-slate-100 dark:border-slate-700">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize mt-0.5">{user?.role}</p>
                                </div>
                                <div className="p-1">
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <User className="h-4 w-4" /> {t('common.profile')}
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" /> {t('common.logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Page content */}
            <main className="flex-1 flex flex-col">
                <Outlet />
            </main>
        </div>
    );
}
