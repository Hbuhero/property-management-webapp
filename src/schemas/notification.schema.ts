import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
    'APPLICATION',
    'LEASE',
    'PAYMENT',
    'MAINTENANCE',
    'SYSTEM',
]);

export const NotificationSchema = z.object({
    id: z.number(),
    title: z.string(),
    message: z.string(),
    type: NotificationTypeSchema,
    isRead: z.boolean(),
    actionLink: z.string().nullable().optional(),
    relatedEntityType: z.string().nullable().optional(),
    relatedEntityId: z.number().nullable().optional(),
    readAt: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
});

export const NotificationListResponseSchema = z.object({
    records: z.array(NotificationSchema),
    unreadCount: z.number(),
});

export const MarkAllNotificationsReadResponseSchema = z.object({
    updated: z.number(),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export type NotificationListFilters = {
    unreadOnly?: boolean;
    page?: number;
    size?: number;
};
