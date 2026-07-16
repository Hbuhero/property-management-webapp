import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import type { Notification } from '@/schemas/notification.schema';

type NotificationDropdownProps = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    isMarkingAll: boolean;
    onMarkAllRead: () => void;
    onSelect: (notification: Notification) => void;
};

export function NotificationDropdown({
    notifications,
    unreadCount,
    isLoading,
    isMarkingAll,
    onMarkAllRead,
    onSelect,
}: NotificationDropdownProps) {
    return (
        <div className="flex max-h-[min(20rem,calc(100vh-8rem))] flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-1 pb-3 dark:border-slate-700">
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                </div>
                {unreadCount > 0 ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        disabled={isMarkingAll}
                        onClick={onMarkAllRead}
                    >
                        {isMarkingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                        Mark all read
                    </Button>
                ) : null}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Loading…
                </div>
            ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No notifications yet.
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                    <div className="space-y-1 py-2">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
