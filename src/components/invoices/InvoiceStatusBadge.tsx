import type { InvoiceStatus } from '@/schemas/invoice.schema';
import { cn } from '@/lib/utils';

function statusClass(status: InvoiceStatus): string {
    switch (status) {
        case 'PENDING':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'PAID':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'CANCELLED':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

type Props = {
    status: InvoiceStatus;
    className?: string;
};

export function InvoiceStatusBadge({ status, className }: Props) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase',
                statusClass(status),
                className,
            )}
        >
            {status}
        </span>
    );
}
