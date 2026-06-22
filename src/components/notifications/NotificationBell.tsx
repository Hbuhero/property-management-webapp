import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { cn } from '@/lib/utils';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotifications,
} from '@/queries/notification.queries';
import type { Notification } from '@/schemas/notification.schema';
import type { RootState } from '@/store';

type NotificationBellProps = {
    triggerClassName?: string;
    align?: 'start' | 'center' | 'end';
};

export function NotificationBell({ triggerClassName, align = 'end' }: NotificationBellProps) {
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [open, setOpen] = useState(false);

    const { data, isLoading } = useNotifications({ size: 20 });
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    if (!isAuthenticated) {
        return null;
    }

    const notifications = data?.records ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    const handleSelect = (notification: Notification) => {
        if (!notification.isRead) {
            markRead.mutate(notification.id);
        }
        setOpen(false);
        if (notification.actionLink) {
            navigate(notification.actionLink);
        }
    };

    const handleMarkAllRead = () => {
        markAllRead.mutate();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={
                        unreadCount > 0
                            ? `Notifications, ${unreadCount} unread`
                            : 'Notifications'
                    }
                    className={cn(
                        'relative h-9 w-9 rounded-xl text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400',
                        triggerClassName,
                    )}
                >
                    <Bell className="h-4 w-4" aria-hidden />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-80 rounded-2xl p-3">
                <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    isLoading={isLoading}
                    isMarkingAll={markAllRead.isPending}
                    onMarkAllRead={handleMarkAllRead}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}
