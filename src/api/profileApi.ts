import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    ProfileSchema,
    ProfileUpdateBodySchema,
    type Profile,
    type ProfileUpdateBody,
} from '@/schemas/profile.schema';
import { z } from 'zod';

const ProfileUpdateResponseSchema = ProfileSchema.extend({
    updatedAt: z.string().nullable().optional(),
    permissions: z.string().nullable().optional(),
});

export async function fetchProfile(): Promise<Profile> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/users/profile`, { method: 'GET' });
    return ProfileSchema.parse(raw);
}

export async function updateProfile(
    id: number | string,
    body: ProfileUpdateBody,
): Promise<Profile> {
    const payload = ProfileUpdateBodySchema.parse(body);
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}`,
        {
            method: 'PUT',
            body: JSON.stringify(payload),
        },
    );
    const updated = ProfileUpdateResponseSchema.parse(raw);
    return ProfileSchema.parse({
        ...updated,
        image: updated.image ?? payload.image,
    });
}
