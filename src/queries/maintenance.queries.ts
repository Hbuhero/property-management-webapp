import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createMaintenance,
    fetchMaintenanceRequest,
    fetchMaintenanceRequests,
    updateMaintenance,
} from '@/api/maintenanceApi';
import type {
    CreateMaintenanceInput,
    MaintenanceListFilters,
    UpdateMaintenanceInput,
} from '@/schemas/maintenance.schema';

export const maintenanceKeys = {
    all: ['maintenance'] as const,
    list: (filters?: MaintenanceListFilters) =>
        [...maintenanceKeys.all, 'list', filters ?? {}] as const,
    detail: (id: number | string) => [...maintenanceKeys.all, 'detail', String(id)] as const,
};

export function useMaintenanceRequests(filters?: MaintenanceListFilters) {
    return useQuery({
        queryKey: maintenanceKeys.list(filters),
        queryFn: () => fetchMaintenanceRequests(filters),
    });
}

export function useMaintenanceRequest(id: number | string | undefined) {
    return useQuery({
        queryKey: id != null ? maintenanceKeys.detail(id) : [...maintenanceKeys.all, 'detail', 'missing'],
        queryFn: () => fetchMaintenanceRequest(id as number | string),
        enabled: id != null,
    });
}

export function useCreateMaintenance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateMaintenanceInput) => createMaintenance(body),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
}

export function useUpdateMaintenance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: UpdateMaintenanceInput }) =>
            updateMaintenance(id, body),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
}
