import { Link } from 'react-router-dom';
import { Building2, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type DashboardSidebarHeaderProps = {
    collapsed: boolean;
    onToggle: () => void;
};

export function DashboardSidebarHeader({ collapsed, onToggle }: DashboardSidebarHeaderProps) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                'shrink-0 border-b border-slate-200 dark:border-slate-800',
                collapsed ? 'px-2 py-3' : 'px-4 py-4',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-2',
                    collapsed ? 'flex-col-reverse' : 'justify-between',
                )}
            >
                <Link
                    to="/"
                    className={cn(
                        'flex min-w-0 items-center gap-2 rounded-lg transition-colors hover:opacity-90',
                        collapsed && 'justify-center',
                    )}
                    title={t('common.appName')}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
                        <Building2 className="h-5 w-5 text-white" aria-hidden />
                    </div>
                    {!collapsed ? (
                        <span className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                            Alcove{' '}
                            <span className="text-emerald-600 dark:text-emerald-400">PMS</span>
                        </span>
                    ) : null}
                </Link>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <Menu className="h-5 w-5" aria-hidden />
                </button>
            </div>
        </div>
    );
}
