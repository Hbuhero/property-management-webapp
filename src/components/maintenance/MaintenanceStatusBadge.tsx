import type { MaintenanceStatus } from '@/schemas/maintenance.schema';
import { cn } from '@/lib/utils';
import { formatMaintenanceStatus } from '@/components/maintenance/maintenanceLabels';

function statusClass(status: MaintenanceStatus): string {
    switch (status) {
        case 'SUBMITTED':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'UNDER_REVIEW':
            return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
        case 'IN_PROGRESS':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'RESOLVED':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'CLOSED':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

type Props = {
    status: MaintenanceStatus;
    className?: string;
};

export function MaintenanceStatusBadge({ status, className }: Props) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase',
                statusClass(status),
                className,
            )}
        >
            {formatMaintenanceStatus(status)}
        </span>
    );
}
