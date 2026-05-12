import { useQuery } from '@tanstack/react-query';
import { fetchAdminPropertiesPage } from '@/api/adminPropertiesApi';
import type { AdminPropertyListParams } from '@/schemas/adminProperty.schema';

export const adminPropertyKeys = {
    all: ['admin-properties'] as const,
    list: (params?: AdminPropertyListParams) => [...adminPropertyKeys.all, 'list', params ?? {}] as const,
};

export function useAdminProperties(params?: AdminPropertyListParams) {
    return useQuery({
        queryKey: adminPropertyKeys.list(params),
        queryFn: () => fetchAdminPropertiesPage(params),
    });
}
