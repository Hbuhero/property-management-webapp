import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLeasePreset, saveLeasePreset } from '@/api/leasePresetApi';
import type { LeasePresetInput } from '@/schemas/leasePreset.schema';

export const leasePresetKeys = {
    all: ['lease-presets'] as const,
    detail: (propertyId: number | string, unitId: number | string) =>
        [...leasePresetKeys.all, String(propertyId), String(unitId)] as const,
};

export function useLeasePreset(
    propertyId: number | string | null | undefined,
    unitId: number | string | null | undefined,
) {
    const pid = propertyId != null ? String(propertyId) : '';
    const uid = unitId != null ? String(unitId) : '';
    return useQuery({
        queryKey: leasePresetKeys.detail(pid, uid),
        queryFn: () => fetchLeasePreset(propertyId as number | string, unitId as number | string),
        enabled: pid.length > 0 && uid.length > 0,
    });
}

export function useSaveLeasePreset() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            propertyId,
            unitId,
            body,
        }: {
            propertyId: number | string;
            unitId: number | string;
            body: LeasePresetInput;
        }) => saveLeasePreset(propertyId, unitId, body),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: leasePresetKeys.detail(vars.propertyId, vars.unitId) });
        },
    });
}
