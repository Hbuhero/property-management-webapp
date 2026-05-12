import { z } from 'zod';
import { PaginationMetaSchema, PropertyStatusSchema } from '@/schemas/property.schema';

export const PropertyAdminRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    location: z.string(),
    status: PropertyStatusSchema,
    propertyTypeName: z.string().nullable().optional(),
    ownerId: z.number().nullable().optional(),
    ownerFullName: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const PropertyAdminPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(PropertyAdminRowSchema),
});

export type PropertyAdminRow = z.infer<typeof PropertyAdminRowSchema>;
export type PropertyAdminPage = z.infer<typeof PropertyAdminPageSchema>;

export type AdminPropertyListParams = {
    page?: number;
    size?: number;
};
