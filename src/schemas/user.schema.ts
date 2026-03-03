import { z } from 'zod';

export const userRoleEnum = z.enum(['admin', 'tenant', 'landlord', 'owner']);

export const userSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: userRoleEnum,
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
});

export type UserSchemaType = z.infer<typeof userSchema>;
