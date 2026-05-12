import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';

const PaginationMetaSchema = z.object({
    pageNo: z.string(),
    pageSize: z.string(),
    totalSize: z.string(),
    pageCount: z.string(),
});

const IdNameRowSchema = z
    .object({
        id: z.number(),
        name: z.string(),
    })
    .passthrough();

const PagedIdNameSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(IdNameRowSchema),
});

export type IdName = { id: number; name: string };

/** Paginated regions (`GET /regions`). */
export async function fetchRegionsLookup(): Promise<IdName[]> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions?size=500&page=0`);
    const parsed = PagedIdNameSchema.parse(raw);
    return parsed.records.map((r) => ({ id: r.id, name: r.name }));
}

/** `GET /regions/{id}/districts` — plain array. */
export async function fetchDistrictsByRegion(regionId: number): Promise<IdName[]> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/regions/${regionId}/districts`);
    return z.array(IdNameRowSchema).parse(raw).map((r) => ({ id: r.id, name: r.name }));
}

/** `GET /districts/{id}/wards` — plain array. */
export async function fetchWardsByDistrict(districtId: number): Promise<IdName[]> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/districts/${districtId}/wards`);
    return z.array(IdNameRowSchema).parse(raw).map((r) => ({ id: r.id, name: r.name }));
}

/** Paginated property types (`GET /property-types`). */
export async function fetchPropertyTypesLookup(): Promise<IdName[]> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/property-types?size=500&page=0`);
    const parsed = PagedIdNameSchema.parse(raw);
    return parsed.records.map((r) => ({ id: r.id, name: r.name }));
}
