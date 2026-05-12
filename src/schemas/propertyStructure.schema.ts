import { z } from 'zod';
import { FloorUnitTypeSchema, MapUnitStatusSchema } from '@/lib/contracts/preVisualMapContracts';

export const FloorStructureSchema = z.object({
    id: z.number(),
    propertyId: z.number(),
    label: z.string(),
    sortOrder: z.number().nullable().optional(),
    unitCount: z.number(),
});

export const FloorUnitStructureSchema = z.object({
    id: z.number(),
    floorId: z.number(),
    unitNumber: z.string(),
    bedrooms: z.number().nullable().optional(),
    sizeM2: z.number().nullable().optional(),
    monthlyRent: z.number().nullable().optional(),
    status: MapUnitStatusSchema,
    unitType: z.union([FloorUnitTypeSchema, z.string()]).nullable().optional(),
    amenities: z.array(z.string()).optional(),
});

export const FloorCreateSchema = z.object({
    label: z.string().min(1),
    sortOrder: z.number().optional(),
});

export const FloorPatchSchema = z.object({
    label: z.string().optional(),
    sortOrder: z.number().optional(),
});

export const FloorUnitSeedSchema = z.object({
    unitNumber: z.string().min(1),
    bedrooms: z.number().optional(),
    sizeM2: z.number().optional(),
    monthlyRent: z.number().optional(),
    status: MapUnitStatusSchema.optional(),
    unitType: z.union([FloorUnitTypeSchema, z.string()]).optional(),
    amenities: z.array(z.string()).optional(),
});

export const BulkFloorUnitsSchema = z.object({
    units: z.array(FloorUnitSeedSchema).min(1),
});

export const FloorUnitPatchSchema = z.object({
    unitNumber: z.string().optional(),
    bedrooms: z.number().optional(),
    sizeM2: z.number().optional(),
    monthlyRent: z.number().optional(),
    status: MapUnitStatusSchema.optional(),
    unitType: z.union([FloorUnitTypeSchema, z.string()]).optional(),
    amenities: z.array(z.string()).optional(),
});

export type FloorStructure = z.infer<typeof FloorStructureSchema>;
export type FloorUnitStructure = z.infer<typeof FloorUnitStructureSchema>;
export type FloorCreateInput = z.infer<typeof FloorCreateSchema>;
export type FloorPatchInput = z.infer<typeof FloorPatchSchema>;
export type BulkFloorUnitsInput = z.infer<typeof BulkFloorUnitsSchema>;
export type FloorUnitPatchInput = z.infer<typeof FloorUnitPatchSchema>;
