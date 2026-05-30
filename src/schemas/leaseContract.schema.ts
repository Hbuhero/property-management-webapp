import { z } from 'zod';
import { MapUnitStatusSchema } from '@/lib/contracts/preVisualMapContracts';

export const LeaseTypeSchema = z.enum(['RECURRING', 'ONE_TIME']);
export const LeaseTimeFrameSchema = z.enum(['DAY', 'MONTH', 'YEAR', 'NONE']);
export const LeaseContractStatusSchema = z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'TERMINATED']);
export const LeaseContractDecisionSchema = z.enum(['ACCEPTED', 'REJECTED']);

export const LeaseItemSchema = z.object({
    id: z.number().nullable().optional(),
    label: z.string(),
    description: z.string().nullable().optional(),
    amount: z.number(),
    totalAmount: z.number().nullable().optional(),
    leaseType: LeaseTypeSchema.nullable().optional(),
    timeFrame: LeaseTimeFrameSchema.nullable().optional(),
    recurringNumber: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    effectiveStartOffsetMonths: z.number().nullable().optional(),
    effectiveDurationMonths: z.number().nullable().optional(),
    sortOrder: z.number().nullable().optional(),
});

export const LeaseItemInputSchema = z.object({
    label: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().positive(),
    leaseType: LeaseTypeSchema.default('ONE_TIME'),
    timeFrame: LeaseTimeFrameSchema.default('NONE'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    recurringNumber: z.number().optional(),
    sortOrder: z.number().optional(),
});

export const LeaseUserSummarySchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
});

export const LeasePropertySummarySchema = z.object({
    id: z.number(),
    title: z.string(),
    location: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    ownerId: z.number().nullable().optional(),
});

export const LeaseUnitSummarySchema = z.object({
    id: z.number(),
    floorId: z.number().nullable().optional(),
    floorLabel: z.string().nullable().optional(),
    unitNumber: z.string(),
    monthlyRent: z.number().nullable().optional(),
    status: z.union([MapUnitStatusSchema, z.string()]).nullable().optional(),
    unitType: z.string().nullable().optional(),
});

export const LeaseContractSchema = z.object({
    id: z.number(),
    status: LeaseContractStatusSchema,
    tenant: LeaseUserSummarySchema,
    property: LeasePropertySummarySchema,
    unit: LeaseUnitSummarySchema.nullable().optional(),
    applicationId: z.number().nullable().optional(),
    startDate: z.string(),
    endDate: z.string(),
    paymentDayOfMonth: z.number().nullable().optional(),
    terms: z.string().nullable().optional(),
    items: z.array(LeaseItemSchema),
    tenantDecision: LeaseContractDecisionSchema.nullable().optional(),
    tenantDecisionAt: z.string().nullable().optional(),
    tenantRejectionReason: z.string().nullable().optional(),
    acceptedSystemTerms: z.boolean().nullable().optional(),
    confirmedPropertyAuthenticity: z.boolean().nullable().optional(),
    systemTermsVersion: z.string().nullable().optional(),
    systemTermsSnapshot: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const CreateLeaseContractSchema = z.object({
    applicationId: z.number().optional(),
    tenantId: z.number().optional(),
    propertyId: z.number(),
    floorUnitId: z.number(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paymentDayOfMonth: z.number().int().min(1).max(28).default(1),
    terms: z.string().optional(),
    items: z.array(LeaseItemInputSchema).default([]),
});

export const TenantAcceptContractSchema = z.object({
    acceptedSystemTerms: z.literal(true),
    confirmedPropertyAuthenticity: z.literal(true),
});

export const TenantRejectContractSchema = z.object({
    reason: z.string().min(1).max(500),
});

export type LeaseItemInput = z.infer<typeof LeaseItemInputSchema>;
export type LeaseContract = z.infer<typeof LeaseContractSchema>;
export type CreateLeaseContractInput = z.infer<typeof CreateLeaseContractSchema>;
export type TenantAcceptContractInput = z.infer<typeof TenantAcceptContractSchema>;
export type TenantRejectContractInput = z.infer<typeof TenantRejectContractSchema>;
