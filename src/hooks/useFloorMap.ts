import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
    getFloorMap,
    saveUnitOverlay,
    toggleUnitStatus,
    uploadFloorPlan,
} from '@/api/floorMapApi';
import type { UnitOverlayPutBody, UnitStatusPatchBody } from '@/lib/contracts/preVisualMapContracts';

export const floorMapKeys = {
    all: ['floor-map'] as const,
    detail: (floorId: number | string) => [...floorMapKeys.all, floorId] as const,
};

export function useFloorMap(floorId: number | string | undefined | null) {
    const enabled =
        floorId !== undefined && floorId !== null && String(floorId).length > 0;
    return useQuery({
        queryKey: [...floorMapKeys.all, floorId] as const,
        queryFn: () => getFloorMap(floorId as number | string),
        enabled,
    });
}

/**
 * After success, invalidates `['floor-map', floorId]` so the public map refetches.
 */
function invalidateFloorMap(qc: QueryClient, floorId: number | string | null | undefined) {
    if (floorId == null || String(floorId).length === 0) return;
    void qc.invalidateQueries({ queryKey: floorMapKeys.detail(floorId) });
}

export function useSaveOverlay(floorId: number | string | null | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            unitId,
            overlay,
        }: {
            unitId: number | string;
            overlay: UnitOverlayPutBody;
        }) => {
            if (floorId == null || String(floorId).length === 0) {
                return Promise.reject(new Error('No floor selected'));
            }
            return saveUnitOverlay(unitId, overlay);
        },
        onSuccess: async () => {
            invalidateFloorMap(qc, floorId);
        },
    });
}

export function useToggleUnitStatus(floorId: number | string | null | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            unitId,
            body,
        }: {
            unitId: number | string;
            body: UnitStatusPatchBody;
        }) => {
            if (floorId == null || String(floorId).length === 0) {
                return Promise.reject(new Error('No floor selected'));
            }
            return toggleUnitStatus(unitId, body);
        },
        onSuccess: async () => {
            invalidateFloorMap(qc, floorId);
        },
    });
}

/**
 * Multipart floor plan upload; invalidates the floor map query for `floorId`.
 */
export function useUploadFloorPlan(floorId: number | string | null | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => {
            if (floorId == null || String(floorId).length === 0) {
                return Promise.reject(new Error('No floor selected'));
            }
            return uploadFloorPlan(floorId, formData);
        },
        onSuccess: async () => {
            invalidateFloorMap(qc, floorId);
        },
    });
}
