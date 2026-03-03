import { z } from 'zod';

export const propertySchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    rent: z.number().positive('Rent must be a positive number'),
    bedrooms: z.number().int().min(0, 'Bedrooms cannot be negative'),
    bathrooms: z.number().int().min(0, 'Bathrooms cannot be negative'),
    location: z.string().min(1, 'Location is required'),
    available: z.boolean(),
    images: z.array(z.string().url()).optional(),
    landlordId: z.string().optional(),
    createdAt: z.string().optional(),
});

export const propertyFilterSchema = z.object({
    minRent: z.number().optional(),
    maxRent: z.number().optional(),
    bedrooms: z.number().optional(),
    location: z.string().optional(),
    available: z.boolean().optional(),
});

export type Property = z.infer<typeof propertySchema>;
export type PropertyFilter = z.infer<typeof propertyFilterSchema>;
