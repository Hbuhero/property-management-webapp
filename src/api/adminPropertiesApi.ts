import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import { PropertyAdminPageSchema, type AdminPropertyListParams } from '@/schemas/adminProperty.schema';
import type { PropertyAdminPage } from '@/schemas/adminProperty.schema';

function buildQuery(params?: AdminPropertyListParams): string {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.size != null) sp.set('size', String(params.size));
    const q = sp.toString();
    return q ? `?${q}` : '';
}

export async function fetchAdminPropertiesPage(params?: AdminPropertyListParams): Promise<PropertyAdminPage> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/admin/properties${buildQuery(params)}`,
        { method: 'GET' },
    );
    return PropertyAdminPageSchema.parse(raw);
}
