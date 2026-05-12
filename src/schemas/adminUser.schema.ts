import { z } from 'zod';
import { PaginationMetaSchema } from '@/schemas/property.schema';

export const AdminUserRowSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    roles: z.array(z.string()),
    permissions: z.string().nullable().optional(),
    status: z.string(),
    passwordReset: z.boolean().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const AdminUserPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(AdminUserRowSchema),
});

export const AdminUserStatsSchema = z.object({
    totalUsers: z.coerce.number(),
    activeUsers: z.coerce.number(),
    disabledUsers: z.coerce.number(),
    suspendedUsers: z.coerce.number(),
    roleStats: z.record(z.string(), z.coerce.number()),
});

export type AdminUserRow = z.infer<typeof AdminUserRowSchema>;
export type AdminUserPage = z.infer<typeof AdminUserPageSchema>;
export type AdminUserStats = z.infer<typeof AdminUserStatsSchema>;

export type AdminUserListParams = {
    page?: number;
    size?: number;
    status?: string;
    role?: string;
    search?: string;
};

export const AdminUserUpdateBodySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10).max(15),
    role: z.string(),
    permissions: z.string().optional(),
    image: z.string().optional(),
});

export type AdminUserUpdateBody = z.infer<typeof AdminUserUpdateBodySchema>;
