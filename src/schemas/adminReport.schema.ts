import { z } from 'zod';

export const AdminActivityEventSchema = z.object({
    occurredAt: z.string(),
    category: z.string(),
    summary: z.string(),
    actor: z.string(),
    detail: z.string(),
});

export const AdminSystemSummarySchema = z.object({
    from: z.string(),
    to: z.string(),
    totalUsers: z.coerce.number(),
    activeUsers: z.coerce.number(),
    disabledUsers: z.coerce.number(),
    suspendedUsers: z.coerce.number(),
    roleStats: z.record(z.string(), z.coerce.number()),
    totalProperties: z.coerce.number(),
    totalInvoices: z.coerce.number(),
    pendingInvoices: z.coerce.number(),
    paidInvoices: z.coerce.number(),
    cancelledInvoices: z.coerce.number(),
    totalApplications: z.coerce.number(),
    pendingApplications: z.coerce.number(),
    approvedApplications: z.coerce.number(),
    rejectedApplications: z.coerce.number(),
    totalMaintenance: z.coerce.number(),
    openMaintenance: z.coerce.number(),
    totalLeases: z.coerce.number(),
    activeLeases: z.coerce.number(),
    recentActivity: z.array(AdminActivityEventSchema),
});

export type AdminActivityEvent = z.infer<typeof AdminActivityEventSchema>;
export type AdminSystemSummary = z.infer<typeof AdminSystemSummarySchema>;

export type AdminReportFilters = {
    from?: string;
    to?: string;
    status?: string;
    activityLimit?: number;
};
