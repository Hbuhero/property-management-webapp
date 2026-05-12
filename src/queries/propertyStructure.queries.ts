import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    bulkCreateOwnerUnits,
    createOwnerFloor,
    deleteOwnerFloor,
    fetchOwnerFloors,
    fetchOwnerFloorUnits,
    patchOwnerFloor,
    patchOwnerUnit,
} from '@/api/propertyStructureApi';
import { propertyKeys } from '@/queries/property.queries';
import type {
    BulkFloorUnitsInput,
    FloorCreateInput,
    FloorPatchInput,
    FloorUnitPatchInput,
} from '@/schemas/propertyStructure.schema';

export const propertyStructureKeys = {
    all: ['property-structure'] as const,
    floors: (propertyId: number | string) =>
        [...propertyStructureKeys.all, 'floors', String(propertyId)] as const,
    units: (propertyId: number | string, floorId: number | string) =>
        [...propertyStructureKeys.all, 'units', String(propertyId), String(floorId)] as const,
};

export function useOwnerFloors(propertyId: number | string | null | undefined) {
    const pid = propertyId != null ? String(propertyId) : '';
    return useQuery({
        queryKey: propertyStructureKeys.floors(pid),
        queryFn: () => fetchOwnerFloors(propertyId as number | string),
        enabled: pid.length > 0,
    });
}

export function useOwnerFloorUnits(
    propertyId: number | string | null | undefined,
    floorId: number | string | null | undefined,
) {
    const pid = propertyId != null ? String(propertyId) : '';
    const fid = floorId != null ? String(floorId) : '';
    return useQuery({
        queryKey: propertyStructureKeys.units(pid, fid),
        queryFn: () =>
            fetchOwnerFloorUnits(propertyId as number | string, floorId as number | string),
        enabled: pid.length > 0 && fid.length > 0,
    });
}

function invalidateStructure(qc: QueryClient, propertyId: number | string, floorId?: number | string) {
    void qc.invalidateQueries({ queryKey: propertyStructureKeys.floors(propertyId) });
    void qc.invalidateQueries({ queryKey: propertyKeys.all });
    if (floorId !== undefined) {
        void qc.invalidateQueries({
            queryKey: propertyStructureKeys.units(propertyId, floorId),
        });
    }
}

export function useCreateOwnerFloor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, body }: { propertyId: number | string; body: FloorCreateInput }) =>
            createOwnerFloor(propertyId, body),
        onSuccess: (_data, vars) => {
            invalidateStructure(qc, vars.propertyId);
        },
    });
}

export function usePatchOwnerFloor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            propertyId,
            floorId,
            body,
        }: {
            propertyId: number | string;
            floorId: number | string;
            body: FloorPatchInput;
        }) => patchOwnerFloor(propertyId, floorId, body),
        onSuccess: (_data, vars) => {
            invalidateStructure(qc, vars.propertyId, vars.floorId);
        },
    });
}

export function useDeleteOwnerFloor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            propertyId,
            floorId,
        }: {
            propertyId: number | string;
            floorId: number | string;
        }) => deleteOwnerFloor(propertyId, floorId),
        onSuccess: (_data, vars) => {
            invalidateStructure(qc, vars.propertyId);
            void qc.removeQueries({
                queryKey: propertyStructureKeys.units(vars.propertyId, vars.floorId),
            });
        },
    });
}

export function useBulkCreateOwnerUnits() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            propertyId,
            floorId,
            body,
        }: {
            propertyId: number | string;
            floorId: number | string;
            body: BulkFloorUnitsInput;
        }) => bulkCreateOwnerUnits(propertyId, floorId, body),
        onSuccess: (_data, vars) => {
            invalidateStructure(qc, vars.propertyId, vars.floorId);
        },
    });
}

export function usePatchOwnerUnit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            propertyId,
            unitId,
            body,
        }: {
            propertyId: number | string;
            unitId: number | string;
            body: FloorUnitPatchInput;
        }) => patchOwnerUnit(propertyId, unitId, body),
        onSuccess: (data, vars) => {
            invalidateStructure(qc, vars.propertyId, data.floorId);
        },
    });
}
