import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createDistrict,
    createPropertyType,
    createRegion,
    createWard,
    deleteDistrict,
    deletePropertyType,
    deleteRegion,
    deleteWard,
    fetchDistrictsByRegion,
    fetchDistrictsPage,
    fetchPropertyTypesPage,
    fetchRegionsPage,
    fetchWardsPage,
    updateDistrict,
    updatePropertyType,
    updateRegion,
    updateWard,
} from '@/api/adminReferenceDataApi';
import type { ReferenceListParams } from '@/schemas/referenceDataAdmin.schema';

export const adminReferenceKeys = {
    all: ['admin-reference'] as const,
    propertyTypes: (params?: ReferenceListParams) =>
        [...adminReferenceKeys.all, 'property-types', params ?? {}] as const,
    regions: (params?: ReferenceListParams) => [...adminReferenceKeys.all, 'regions', params ?? {}] as const,
    districts: (params?: ReferenceListParams) => [...adminReferenceKeys.all, 'districts', params ?? {}] as const,
    wards: (params?: ReferenceListParams) => [...adminReferenceKeys.all, 'wards', params ?? {}] as const,
    districtsByRegion: (regionId: number) =>
        [...adminReferenceKeys.all, 'districts-by-region', regionId] as const,
};

const listParams: ReferenceListParams = { page: 0, size: 500 };

export function useAdminPropertyTypes() {
    return useQuery({
        queryKey: adminReferenceKeys.propertyTypes(listParams),
        queryFn: () => fetchPropertyTypesPage(listParams),
    });
}

export function useCreatePropertyType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createPropertyType,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminReferenceKeys.all });
            void qc.invalidateQueries({ queryKey: ['reference'] });
        },
    });
}

export function useUpdatePropertyType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updatePropertyType,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminReferenceKeys.all });
            void qc.invalidateQueries({ queryKey: ['reference'] });
        },
    });
}

export function useDeletePropertyType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deletePropertyType,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminReferenceKeys.all });
            void qc.invalidateQueries({ queryKey: ['reference'] });
        },
    });
}

export function useAdminRegions() {
    return useQuery({
        queryKey: adminReferenceKeys.regions(listParams),
        queryFn: () => fetchRegionsPage(listParams),
    });
}

export function useAdminDistricts() {
    return useQuery({
        queryKey: adminReferenceKeys.districts(listParams),
        queryFn: () => fetchDistrictsPage(listParams),
    });
}

export function useAdminWards() {
    return useQuery({
        queryKey: adminReferenceKeys.wards(listParams),
        queryFn: () => fetchWardsPage(listParams),
    });
}

export function useDistrictsByRegion(regionId: number | undefined) {
    return useQuery({
        queryKey: adminReferenceKeys.districtsByRegion(regionId ?? 0),
        queryFn: () => fetchDistrictsByRegion(regionId!),
        enabled: typeof regionId === 'number' && regionId > 0,
    });
}

export function useCreateRegion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createRegion,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useUpdateRegion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateRegion,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useDeleteRegion() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteRegion,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useCreateDistrict() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createDistrict,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useUpdateDistrict() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateDistrict,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useDeleteDistrict() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteDistrict,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useCreateWard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createWard,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useUpdateWard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateWard,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}

export function useDeleteWard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteWard,
        onSuccess: () => void qc.invalidateQueries({ queryKey: adminReferenceKeys.all }),
    });
}
