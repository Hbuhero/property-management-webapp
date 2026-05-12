import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    BulkFloorUnitsSchema,
    FloorCreateSchema,
    FloorPatchSchema,
    FloorStructureSchema,
    FloorUnitPatchSchema,
    FloorUnitStructureSchema,
    type BulkFloorUnitsInput,
    type FloorCreateInput,
    type FloorPatchInput,
    type FloorStructure,
    type FloorUnitPatchInput,
    type FloorUnitStructure,
} from '@/schemas/propertyStructure.schema';

function ownerBase(propertyId: number | string): string {
    return `${API_V1_PREFIX}/owner/properties/${encodeURIComponent(String(propertyId))}`;
}

export async function fetchOwnerFloors(propertyId: number | string): Promise<FloorStructure[]> {
    const raw = await apiJson<unknown>(`${ownerBase(propertyId)}/floors`, { method: 'GET' });
    return z.array(FloorStructureSchema).parse(raw);
}

export async function fetchOwnerFloorUnits(
    propertyId: number | string,
    floorId: number | string,
): Promise<FloorUnitStructure[]> {
    const raw = await apiJson<unknown>(
        `${ownerBase(propertyId)}/floors/${encodeURIComponent(String(floorId))}/units`,
        { method: 'GET' },
    );
    return z.array(FloorUnitStructureSchema).parse(raw);
}

export async function createOwnerFloor(
    propertyId: number | string,
    body: FloorCreateInput,
): Promise<FloorStructure> {
    FloorCreateSchema.parse(body);
    const raw = await apiJson<unknown>(`${ownerBase(propertyId)}/floors`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return FloorStructureSchema.parse(raw);
}

export async function patchOwnerFloor(
    propertyId: number | string,
    floorId: number | string,
    body: FloorPatchInput,
): Promise<FloorStructure> {
    FloorPatchSchema.parse(body);
    const raw = await apiJson<unknown>(
        `${ownerBase(propertyId)}/floors/${encodeURIComponent(String(floorId))}`,
        {
            method: 'PATCH',
            body: JSON.stringify(body),
        },
    );
    return FloorStructureSchema.parse(raw);
}

export async function deleteOwnerFloor(
    propertyId: number | string,
    floorId: number | string,
): Promise<void> {
    await apiJson<unknown>(
        `${ownerBase(propertyId)}/floors/${encodeURIComponent(String(floorId))}`,
        {
            method: 'DELETE',
        },
    );
}

export async function bulkCreateOwnerUnits(
    propertyId: number | string,
    floorId: number | string,
    body: BulkFloorUnitsInput,
): Promise<FloorUnitStructure[]> {
    BulkFloorUnitsSchema.parse(body);
    const raw = await apiJson<unknown>(
        `${ownerBase(propertyId)}/floors/${encodeURIComponent(String(floorId))}/units`,
        {
            method: 'POST',
            body: JSON.stringify(body),
        },
    );
    return z.array(FloorUnitStructureSchema).parse(raw);
}

export async function patchOwnerUnit(
    propertyId: number | string,
    unitId: number | string,
    body: FloorUnitPatchInput,
): Promise<FloorUnitStructure> {
    FloorUnitPatchSchema.parse(body);
    const raw = await apiJson<unknown>(
        `${ownerBase(propertyId)}/units/${encodeURIComponent(String(unitId))}`,
        {
            method: 'PATCH',
            body: JSON.stringify(body),
        },
    );
    return FloorUnitStructureSchema.parse(raw);
}
