import type { MaintenancePriority } from '@/schemas/maintenance.schema';
import { cn } from '@/lib/utils';
import { formatMaintenancePriority } from '@/components/maintenance/maintenanceLabels';

function priorityClass(priority: MaintenancePriority): string {
    switch (priority) {
        case 'LOW':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        case 'MEDIUM':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'HIGH':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        case 'URGENT':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
}

type Props = {
    priority: MaintenancePriority;
    className?: string;
};

export function MaintenancePriorityBadge({ priority, className }: Props) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                priorityClass(priority),
                className,
            )}
        >
            {formatMaintenancePriority(priority)}
        </span>
    );
}
