import { z } from 'zod';
import { MapUnitStatusSchema } from '@/lib/contracts/preVisualMapContracts';

export const ApplicationStatusSchema = z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN',
    'CONTRACT_SENT',
    'CONTRACT_ACCEPTED',
    'CONTRACT_REJECTED',
]);

export const ApplicationUserSummarySchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
});

export const ApplicationPropertySummarySchema = z.object({
    id: z.number(),
    title: z.string(),
    location: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    ownerId: z.number().nullable().optional(),
});

export const ApplicationUnitSummarySchema = z.object({
    id: z.number(),
    floorId: z.number().nullable().optional(),
    floorLabel: z.string().nullable().optional(),
    unitNumber: z.string(),
    monthlyRent: z.number().nullable().optional(),
    status: z.union([MapUnitStatusSchema, z.string()]).nullable().optional(),
    unitType: z.string().nullable().optional(),
});

export const ApplicationSchema = z.object({
    id: z.number(),
    status: ApplicationStatusSchema,
    tenant: ApplicationUserSummarySchema,
    property: ApplicationPropertySummarySchema,
    unit: ApplicationUnitSummarySchema,
    coverNote: z.string().nullable().optional(),
    applicantData: z.string().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    reviewedBy: ApplicationUserSummarySchema.nullable().optional(),
    reviewedAt: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    contractId: z.number().nullable().optional(),
});

export const CreateApplicationSchema = z.object({
    floorUnitId: z.number(),
    coverNote: z.string().max(1000).optional(),
    applicantData: z.string().max(4000).optional(),
});

export const RejectApplicationSchema = z.object({
    reason: z.string().min(1).max(500),
});

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type PropertyApplication = z.infer<typeof ApplicationSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
