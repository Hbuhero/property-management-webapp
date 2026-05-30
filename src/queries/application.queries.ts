import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
    approveApplication,
    createApplication,
    deleteApplication,
    fetchApplication,
    fetchApplications,
    rejectApplication,
    withdrawApplication,
} from '@/api/applicationApi';
import { propertyKeys } from '@/queries/property.queries';
import type {
    ApplicationStatus,
    CreateApplicationInput,
    RejectApplicationInput,
} from '@/schemas/application.schema';

export const applicationKeys = {
    all: ['applications'] as const,
    list: (status?: ApplicationStatus) => [...applicationKeys.all, 'list', status ?? 'all'] as const,
    detail: (id: number | string) => [...applicationKeys.all, 'detail', String(id)] as const,
};

export function useApplications(status?: ApplicationStatus) {
    return useQuery({
        queryKey: applicationKeys.list(status),
        queryFn: () => fetchApplications(status),
    });
}

export function useApplication(id: number | string | undefined) {
    return useQuery({
        queryKey: id != null ? applicationKeys.detail(id) : [...applicationKeys.all, 'detail', 'missing'],
        queryFn: () => fetchApplication(id as number | string),
        enabled: id != null,
    });
}

function invalidateApplicationSurfaces(qc: QueryClient) {
    void qc.invalidateQueries({ queryKey: applicationKeys.all });
    void qc.invalidateQueries({ queryKey: propertyKeys.all });
    void qc.invalidateQueries({ queryKey: ['floor-map'] });
    void qc.invalidateQueries({ queryKey: ['lease-contracts'] });
}

export function useCreateApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateApplicationInput) => createApplication(body),
        onSuccess: () => invalidateApplicationSurfaces(qc),
    });
}

export function useApproveApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => approveApplication(id),
        onSuccess: () => invalidateApplicationSurfaces(qc),
    });
}

export function useRejectApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: RejectApplicationInput }) =>
            rejectApplication(id, body),
        onSuccess: () => invalidateApplicationSurfaces(qc),
    });
}

export function useWithdrawApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => withdrawApplication(id),
        onSuccess: () => invalidateApplicationSurfaces(qc),
    });
}

export function useDeleteApplication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => deleteApplication(id),
        onSuccess: () => invalidateApplicationSurfaces(qc),
    });
}
