import { z } from 'zod';
import { LoginResponseUserSchema } from '@/lib/contracts/preVisualMapContracts';

export const ProfileSchema = LoginResponseUserSchema;

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateBodySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(10).max(15),
    role: z.string(),
    image: z.string().optional(),
});

export type ProfileUpdateBody = z.infer<typeof ProfileUpdateBodySchema>;
