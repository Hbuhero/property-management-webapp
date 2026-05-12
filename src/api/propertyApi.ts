import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    PropertyDetailSchema,
    PropertyPageSchema,
    type PropertyCreateInput,
    type PropertyDetail,
    type PropertyListParams,
    type PropertyPage,
    type PropertyPatchInput,
} from '@/schemas/property.schema';

function buildPageQuery(params?: PropertyListParams): string {
    if (!params) return '';
    const sp = new URLSearchParams();
    if (params.page != null) sp.set('page', String(params.page));
    if (params.size != null) sp.set('size', String(params.size));
    if (params.sortBy != null && params.sortBy !== '') sp.set('sortBy', params.sortBy);
    if (params.sortDirection != null && params.sortDirection !== '')
        sp.set('sortDirection', params.sortDirection);
    const q = sp.toString();
    return q ? `?${q}` : '';
}

/** Backend {@code Message} JSON for mutations that return a body. */
export type ApiMessage = { message: string };

export async function fetchPropertiesPage(params?: PropertyListParams): Promise<PropertyPage> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/properties${buildPageQuery(params)}`, {
        method: 'GET',
    });
    return PropertyPageSchema.parse(raw);
}

export async function fetchOwnerPropertiesPage(params?: PropertyListParams): Promise<PropertyPage> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/owner/properties${buildPageQuery(params)}`, {
        method: 'GET',
    });
    return PropertyPageSchema.parse(raw);
}

export async function fetchPropertyDetail(id: number | string): Promise<PropertyDetail> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/properties/${encodeURIComponent(String(id))}`,
        { method: 'GET' },
    );
    return PropertyDetailSchema.parse(raw);
}

export async function createProperty(body: PropertyCreateInput): Promise<PropertyDetail> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/properties`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return PropertyDetailSchema.parse(raw);
}

export async function patchProperty(id: number | string, body: PropertyPatchInput): Promise<PropertyDetail> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/properties/${encodeURIComponent(String(id))}`,
        {
            method: 'PATCH',
            body: JSON.stringify(body),
        },
    );
    return PropertyDetailSchema.parse(raw);
}

export async function deleteProperty(id: number | string): Promise<ApiMessage> {
    return apiJson<ApiMessage>(
        `${API_V1_PREFIX}/properties/${encodeURIComponent(String(id))}`,
        {
            method: 'DELETE',
        },
    );
}
