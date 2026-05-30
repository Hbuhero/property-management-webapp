import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    LeasePresetInputSchema,
    LeasePresetSchema,
    type LeasePreset,
    type LeasePresetInput,
} from '@/schemas/leasePreset.schema';

function presetPath(propertyId: number | string, unitId: number | string): string {
    return `${API_V1_PREFIX}/owner/properties/${encodeURIComponent(String(propertyId))}/units/${encodeURIComponent(String(unitId))}/lease-preset`;
}

export async function fetchLeasePreset(
    propertyId: number | string,
    unitId: number | string,
): Promise<LeasePreset | null> {
    const raw = await apiJson<unknown>(presetPath(propertyId, unitId), { method: 'GET' });
    return raw == null ? null : LeasePresetSchema.parse(raw);
}

export async function saveLeasePreset(
    propertyId: number | string,
    unitId: number | string,
    body: LeasePresetInput,
): Promise<LeasePreset> {
    LeasePresetInputSchema.parse(body);
    const raw = await apiJson<unknown>(presetPath(propertyId, unitId), {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return LeasePresetSchema.parse(raw);
}
