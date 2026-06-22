import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/api/notificationApi';
import type { NotificationListFilters } from '@/schemas/notification.schema';

const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

export const notificationKeys = {
    all: ['notifications'] as const,
    list: (filters?: NotificationListFilters) =>
        [...notificationKeys.all, 'list', filters ?? {}] as const,
};

export function useNotifications(filters?: NotificationListFilters) {
    return useQuery({
        queryKey: notificationKeys.list(filters),
        queryFn: () => fetchNotifications(filters),
        refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    });
}

export function useMarkNotificationRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => markNotificationRead(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => markAllNotificationsRead(),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}
