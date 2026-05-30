import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
    acceptLeaseContract,
    createLeaseContract,
    fetchLeaseContracts,
    rejectLeaseContract,
    sendLeaseContract,
    updateLeaseContract,
} from '@/api/leaseContractApi';
import { applicationKeys } from '@/queries/application.queries';
import type {
    CreateLeaseContractInput,
    TenantAcceptContractInput,
    TenantRejectContractInput,
} from '@/schemas/leaseContract.schema';

export const leaseContractKeys = {
    all: ['lease-contracts'] as const,
    list: () => [...leaseContractKeys.all, 'list'] as const,
};

export function useLeaseContracts() {
    return useQuery({
        queryKey: leaseContractKeys.list(),
        queryFn: fetchLeaseContracts,
    });
}

function invalidateLeaseSurfaces(qc: QueryClient) {
    void qc.invalidateQueries({ queryKey: leaseContractKeys.all });
    void qc.invalidateQueries({ queryKey: applicationKeys.all });
    void qc.invalidateQueries({ queryKey: ['floor-map'] });
}

export function useCreateLeaseContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateLeaseContractInput) => createLeaseContract(body),
        onSuccess: () => invalidateLeaseSurfaces(qc),
    });
}

export function useUpdateLeaseContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: CreateLeaseContractInput }) =>
            updateLeaseContract(id, body),
        onSuccess: () => invalidateLeaseSurfaces(qc),
    });
}

export function useSendLeaseContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => sendLeaseContract(id),
        onSuccess: () => invalidateLeaseSurfaces(qc),
    });
}

export function useAcceptLeaseContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: TenantAcceptContractInput }) =>
            acceptLeaseContract(id, body),
        onSuccess: () => invalidateLeaseSurfaces(qc),
    });
}

export function useRejectLeaseContract() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: TenantRejectContractInput }) =>
            rejectLeaseContract(id, body),
        onSuccess: () => invalidateLeaseSurfaces(qc),
    });
}
