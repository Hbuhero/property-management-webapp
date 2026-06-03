import type { MaintenanceCategory } from '@/schemas/maintenance.schema';
import { cn } from '@/lib/utils';
import { formatMaintenanceCategory } from '@/components/maintenance/maintenanceLabels';

type Props = {
    category: MaintenanceCategory;
    className?: string;
};

export function MaintenanceCategoryLabel({ category, className }: Props) {
    return (
        <span className={cn('text-sm text-slate-600 dark:text-slate-400', className)}>
            {formatMaintenanceCategory(category)}
        </span>
    );
}
