import { z } from 'zod';
import { PaginationMetaSchema } from '@/schemas/property.schema';

export const PropertyTypeRowSchema = z
    .object({
        id: z.number(),
        name: z.string(),
    })
    .passthrough();

export const RegionRowSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        postCode: z.string(),
    })
    .passthrough();

export const DistrictRowSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        region: z.number(),
        regionName: z.string().optional(),
    })
    .passthrough();

export const WardRowSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        district: z.number(),
        districtName: z.string().optional(),
    })
    .passthrough();

export const PropertyTypePageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(PropertyTypeRowSchema),
});

export const RegionPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(RegionRowSchema),
});

export const DistrictPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(DistrictRowSchema),
});

export const WardPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(WardRowSchema),
});

export type PropertyTypeRow = z.infer<typeof PropertyTypeRowSchema>;
export type RegionRow = z.infer<typeof RegionRowSchema>;
export type DistrictRow = z.infer<typeof DistrictRowSchema>;
export type WardRow = z.infer<typeof WardRowSchema>;

export type PropertyTypePage = z.infer<typeof PropertyTypePageSchema>;
export type RegionPage = z.infer<typeof RegionPageSchema>;
export type DistrictPage = z.infer<typeof DistrictPageSchema>;
export type WardPage = z.infer<typeof WardPageSchema>;

export type ReferenceListParams = {
    page?: number;
    size?: number;
};

export type PropertyTypeBody = { id?: number; name: string };
export type RegionBody = { id?: number; name: string; postCode: string };
export type DistrictBody = { id?: number; name: string; region: number };
export type WardBody = { id?: number; name: string; district: number };
