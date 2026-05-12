import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createProperty,
    deleteProperty,
    fetchOwnerPropertiesPage,
    fetchPropertiesPage,
    fetchPropertyDetail,
    patchProperty,
} from '@/api/propertyApi';
import type {
    PropertyCreateInput,
    PropertyListParams,
    PropertyPatchInput,
} from '@/schemas/property.schema';

export const propertyKeys = {
    all: ['properties'] as const,
    list: (params?: PropertyListParams) => [...propertyKeys.all, 'list', params ?? {}] as const,
    detail: (id: string | number) => [...propertyKeys.all, 'detail', String(id)] as const,
};

export const ownerPropertyKeys = {
    all: ['owner-properties'] as const,
    list: (params?: PropertyListParams) => [...ownerPropertyKeys.all, 'list', params ?? {}] as const,
};

export function useOwnerProperties(params?: PropertyListParams) {
    return useQuery({
        queryKey: ownerPropertyKeys.list(params),
        queryFn: () => fetchOwnerPropertiesPage(params),
    });
}

export function useProperties(params?: PropertyListParams) {
    return useQuery({
        queryKey: propertyKeys.list(params),
        queryFn: () => fetchPropertiesPage(params),
    });
}

export function useProperty(id: string | number | null | undefined) {
    const sid = id !== null && id !== undefined ? String(id) : '';
    return useQuery({
        queryKey: propertyKeys.detail(sid),
        queryFn: () => fetchPropertyDetail(id as string | number),
        enabled: sid.length > 0,
    });
}

export function useCreateProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: PropertyCreateInput) => createProperty(body),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: propertyKeys.all });
            void qc.invalidateQueries({ queryKey: ownerPropertyKeys.all });
        },
    });
}

export function usePatchProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, patch }: { id: number | string; patch: PropertyPatchInput }) =>
            patchProperty(id, patch),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: propertyKeys.detail(vars.id) });
            void qc.invalidateQueries({ queryKey: propertyKeys.all });
            void qc.invalidateQueries({ queryKey: ownerPropertyKeys.all });
        },
    });
}

/** @deprecated Use {@link usePatchProperty}. */
export const useUpdateProperty = usePatchProperty;

export function useDeleteProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => deleteProperty(id),
        onSuccess: (_data, id) => {
            void qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
            void qc.invalidateQueries({ queryKey: propertyKeys.all });
            void qc.invalidateQueries({ queryKey: ownerPropertyKeys.all });
        },
    });
}
