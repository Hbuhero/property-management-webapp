import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    MarkAllNotificationsReadResponseSchema,
    NotificationListResponseSchema,
    NotificationSchema,
    type Notification,
    type NotificationListFilters,
    type NotificationListResponse,
} from '@/schemas/notification.schema';

function notificationsPath(id?: number | string): string {
    const base = `${API_V1_PREFIX}/notifications`;
    return id == null ? base : `${base}/${encodeURIComponent(String(id))}`;
}

function buildNotificationsQuery(filters?: NotificationListFilters): string {
    if (!filters) {
        return '';
    }
    const params = new URLSearchParams();
    if (filters.unreadOnly) {
        params.set('unreadOnly', 'true');
    }
    if (filters.page != null) {
        params.set('page', String(filters.page));
    }
    if (filters.size != null) {
        params.set('size', String(filters.size));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export async function fetchNotifications(
    filters?: NotificationListFilters,
): Promise<NotificationListResponse> {
    const raw = await apiJson<unknown>(
        `${notificationsPath()}${buildNotificationsQuery(filters)}`,
        { method: 'GET' },
    );
    return NotificationListResponseSchema.parse(raw);
}

export async function markNotificationRead(id: number | string): Promise<Notification> {
    const raw = await apiJson<unknown>(`${notificationsPath(id)}/read`, {
        method: 'PATCH',
    });
    return NotificationSchema.parse(raw);
}

export async function markAllNotificationsRead(): Promise<number> {
    const raw = await apiJson<unknown>(`${notificationsPath()}/read-all`, {
        method: 'POST',
    });
    return MarkAllNotificationsReadResponseSchema.parse(raw).updated;
}
