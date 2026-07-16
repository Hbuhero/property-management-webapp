import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    DistrictPageSchema,
    DistrictRowSchema,
    PropertyTypePageSchema,
    PropertyTypeRowSchema,
    RegionPageSchema,
    RegionRowSchema,
    WardPageSchema,
    WardRowSchema,
    type DistrictBody,
    type PropertyTypeBody,
    type ReferenceListParams,
    type RegionBody,
    type WardBody,
} from '@/schemas/referenceDataAdmin.schema';
import { z } from 'zod';

function toQuery(params?: ReferenceListParams): string {
    const sp = new URLSearchParams();
    sp.set('page', String(params?.page ?? 0));
    sp.set('size', String(params?.size ?? 500));
    return `?${sp.toString()}`;
}

export async function fetchPropertyTypesPage(params?: ReferenceListParams) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/property-types${toQuery(params)}`, {
        method: 'GET',
    });
    return PropertyTypePageSchema.parse(raw);
}

export async function createPropertyType(body: PropertyTypeBody) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/property-types`, {
        method: 'POST',
        body: JSON.stringify({ name: body.name.trim() }),
    });
    return PropertyTypeRowSchema.parse(raw);
}

export async function updatePropertyType(body: PropertyTypeBody & { id: number }) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/property-types`, {
        method: 'PUT',
        body: JSON.stringify({ id: body.id, name: body.name.trim() }),
    });
    return PropertyTypeRowSchema.parse(raw);
}

export async function deletePropertyType(id: number) {
    await apiJson<unknown>(`${API_V1_PREFIX}/property-types/${id}`, { method: 'DELETE' });
}

export async function fetchRegionsPage(params?: ReferenceListParams) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions${toQuery(params)}`, { method: 'GET' });
    return RegionPageSchema.parse(raw);
}

export async function createRegion(body: RegionBody) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions`, {
        method: 'POST',
        body: JSON.stringify({
            name: body.name.trim(),
            postCode: body.postCode.trim(),
        }),
    });
    return RegionRowSchema.parse(raw);
}

export async function updateRegion(body: RegionBody & { id: number }) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions`, {
        method: 'PUT',
        body: JSON.stringify({
            id: body.id,
            name: body.name.trim(),
            postCode: body.postCode.trim(),
        }),
    });
    return RegionRowSchema.parse(raw);
}

export async function deleteRegion(id: number) {
    await apiJson<unknown>(`${API_V1_PREFIX}/regions/${id}`, { method: 'DELETE' });
}

export async function fetchDistrictsPage(params?: ReferenceListParams) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/districts${toQuery(params)}`, { method: 'GET' });
    return DistrictPageSchema.parse(raw);
}

export async function createDistrict(body: DistrictBody) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/districts`, {
        method: 'POST',
        body: JSON.stringify({
            name: body.name.trim(),
            region: body.region,
        }),
    });
    return DistrictRowSchema.parse(raw);
}

export async function updateDistrict(body: DistrictBody & { id: number }) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/districts`, {
        method: 'PUT',
        body: JSON.stringify({
            id: body.id,
            name: body.name.trim(),
            region: body.region,
        }),
    });
    return DistrictRowSchema.parse(raw);
}

export async function deleteDistrict(id: number) {
    await apiJson<unknown>(`${API_V1_PREFIX}/districts/${id}`, { method: 'DELETE' });
}

export async function fetchWardsPage(params?: ReferenceListParams) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/wards${toQuery(params)}`, { method: 'GET' });
    return WardPageSchema.parse(raw);
}

export async function fetchDistrictsByRegion(regionId: number) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions/${regionId}/districts`, { method: 'GET' });
    return z.array(DistrictRowSchema).parse(raw);
}

export async function createWard(body: WardBody) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/wards`, {
        method: 'POST',
        body: JSON.stringify({
            name: body.name.trim(),
            district: body.district,
        }),
    });
    return WardRowSchema.parse(raw);
}

export async function updateWard(body: WardBody & { id: number }) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/wards`, {
        method: 'PUT',
        body: JSON.stringify({
            id: body.id,
            name: body.name.trim(),
            district: body.district,
        }),
    });
    return WardRowSchema.parse(raw);
}

export async function deleteWard(id: number) {
    await apiJson<unknown>(`${API_V1_PREFIX}/wards/${id}`, { method: 'DELETE' });
}
