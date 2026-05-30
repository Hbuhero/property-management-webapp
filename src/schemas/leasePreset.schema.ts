import { z } from 'zod';
import { LeaseItemInputSchema, LeaseItemSchema } from '@/schemas/leaseContract.schema';

export const LeasePresetSchema = z.object({
    id: z.number(),
    propertyId: z.number(),
    floorUnitId: z.number(),
    terms: z.string().nullable().optional(),
    bookingRequirements: z.array(z.string()).default([]),
    durationMonths: z.number(),
    paymentDayOfMonth: z.number(),
    active: z.boolean(),
    items: z.array(LeaseItemSchema),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const LeasePresetInputSchema = z.object({
    terms: z.string().optional(),
    bookingRequirements: z.string().optional(),
    durationMonths: z.number().int().min(1).max(120).default(12),
    paymentDayOfMonth: z.number().int().min(1).max(28).default(1),
    active: z.boolean().default(true),
    items: z.array(LeaseItemInputSchema).default([]),
});

export type LeasePreset = z.infer<typeof LeasePresetSchema>;
export type LeasePresetInput = z.infer<typeof LeasePresetInputSchema>;
