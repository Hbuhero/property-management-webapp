import { z } from 'zod';

export const MaintenanceCategorySchema = z.enum([
    'PLUMBING',
    'ELECTRICAL',
    'STRUCTURAL',
    'APPLIANCE',
    'PEST',
    'CLEANING',
    'SECURITY',
    'OTHER',
]);

export const MaintenancePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const MaintenanceStatusSchema = z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
]);

const MaintenanceUserSummarySchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
});

const MaintenancePropertySummarySchema = z.object({
    id: z.number(),
    title: z.string(),
    location: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    ownerId: z.number().nullable().optional(),
});

const MaintenanceUnitSummarySchema = z.object({
    id: z.number(),
    floorId: z.number().nullable().optional(),
    floorLabel: z.string().nullable().optional(),
    unitNumber: z.string(),
    monthlyRent: z.number().nullable().optional(),
    status: z.string().nullable().optional(),
    unitType: z.string().nullable().optional(),
});

export const MaintenanceRequestSchema = z.object({
    id: z.number(),
    status: MaintenanceStatusSchema,
    tenant: MaintenanceUserSummarySchema,
    property: MaintenancePropertySummarySchema,
    unit: MaintenanceUnitSummarySchema,
    leaseContractId: z.number().nullable().optional(),
    title: z.string(),
    description: z.string(),
    category: MaintenanceCategorySchema,
    priority: MaintenancePrioritySchema,
    resolutionNotes: z.string().nullable().optional(),
    imageUrls: z.array(z.string()).default([]),
    resolvedAt: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const CreateMaintenanceSchema = z.object({
    floorUnitId: z.number(),
    leaseContractId: z.number().optional(),
    title: z.string().min(5).max(120),
    description: z.string().min(10).max(2000),
    category: MaintenanceCategorySchema,
    priority: MaintenancePrioritySchema.default('MEDIUM'),
    imageUrls: z.array(z.string()).max(5).default([]),
});

export const UpdateMaintenanceSchema = z.object({
    status: MaintenanceStatusSchema,
    resolutionNotes: z.string().max(2000).optional(),
});

export type MaintenanceCategory = z.infer<typeof MaintenanceCategorySchema>;
export type MaintenancePriority = z.infer<typeof MaintenancePrioritySchema>;
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>;
export type MaintenanceRequest = z.infer<typeof MaintenanceRequestSchema>;
export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof UpdateMaintenanceSchema>;

export type MaintenanceListFilters = {
    status?: MaintenanceStatus;
    category?: MaintenanceCategory;
    priority?: MaintenancePriority;
    propertyId?: number;
    floorUnitId?: number;
    tenantId?: number;
};
