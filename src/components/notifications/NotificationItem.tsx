import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Notification } from '@/schemas/notification.schema';

const TYPE_LABELS: Record<Notification['type'], string> = {
    APPLICATION: 'Application',
    LEASE: 'Lease',
    PAYMENT: 'Payment',
    MAINTENANCE: 'Maintenance',
    SYSTEM: 'System',
};

type NotificationItemProps = {
    notification: Notification;
    onSelect: (notification: Notification) => void;
};

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
    const createdLabel = notification.createdAt
        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
        : null;

    return (
        <button
            type="button"
            onClick={() => onSelect(notification)}
            className={cn(
                'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                !notification.isRead && 'bg-emerald-50/70 dark:bg-emerald-950/30',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {notification.title}
                </p>
                {!notification.isRead ? (
                    <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                        aria-hidden
                    />
                ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                {notification.message}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {TYPE_LABELS[notification.type]}
                </Badge>
                {createdLabel ? (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{createdLabel}</span>
                ) : null}
            </div>
        </button>
    );
}
