import { z } from 'zod';
import {
    LoginResponseSchema,
    LoginResponseUserSchema,
    SignupResponseSchema,
} from '@/lib/contracts/preVisualMapContracts';

/** Login form (client-side only). */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/** Roles allowed on public registration (must match {@link dev.hud.PropertyManagementSystem.models.Role} names). */
export const selfRegistrationRoleSchema = z.enum(['USER', 'TENANT', 'LAND_LORD']);

export type SelfRegistrationRole = z.infer<typeof selfRegistrationRoleSchema>;

/** Self-service registration (matches backend {@code UserRequest} for signup). */
export const registerSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: z.string().min(1, 'Email is required').email('Enter a valid email'),
        /** Backend {@code @Size(10,15)} applies to the stored string; we validate 10–15 digits so E.164 (+…) works. */
        phoneNumber: z
            .string()
            .trim()
            .refine((s) => {
                const digits = s.replace(/\D/g, '');
                return digits.length >= 10 && digits.length <= 15;
            }, 'Phone must contain 10–15 digits'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(1, 'Confirm your password'),
        role: selfRegistrationRoleSchema,
        image: z.string().max(2000).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<typeof registerSchema>;

/** Re-export API-aligned schemas for auth flows (login, refresh, activate, signup). */
export { LoginResponseSchema, LoginResponseUserSchema, SignupResponseSchema };
