import { apiJson } from '@/lib/apiClient';
import {
    FloorMapResponseSchema,
    type FloorMapDto,
    type UnitOverlayPutBody,
    type UnitStatusPatchBody,
    VisualMapApi,
} from '@/lib/contracts/preVisualMapContracts';

/** Backend {@code Message} JSON for admin mutations. */
export type ApiMessage = { message: string };

/**
 * Public floor map (no auth).
 * @throws if response shape is unexpected
 */
export async function getFloorMap(floorId: number | string): Promise<FloorMapDto> {
    const raw = await apiJson<unknown>(VisualMapApi.floorMap(floorId), {
        method: 'GET',
        skipAuth: true,
    });
    return FloorMapResponseSchema.parse(raw);
}

/**
 * Multipart upload: include `file`, `imageWidth`, `imageHeight` as fields.
 */
export async function uploadFloorPlan(
    floorId: number | string,
    formData: FormData,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.adminFloorPlan(floorId), {
        method: 'POST',
        body: formData,
    });
}

export async function saveUnitOverlay(
    unitId: number | string,
    overlay: UnitOverlayPutBody,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.adminUnitOverlay(unitId), {
        method: 'PUT',
        body: JSON.stringify(overlay),
    });
}

export async function toggleUnitStatus(
    unitId: number | string,
    body: UnitStatusPatchBody,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.adminUnitStatus(unitId), {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

/** Property owner APIs — same payloads; requires JWT with landlord/owner session. */
export async function uploadFloorPlanAsOwner(
    floorId: number | string,
    formData: FormData,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.ownerFloorPlan(floorId), {
        method: 'POST',
        body: formData,
    });
}

export async function saveUnitOverlayAsOwner(
    unitId: number | string,
    overlay: UnitOverlayPutBody,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.ownerUnitOverlay(unitId), {
        method: 'PUT',
        body: JSON.stringify(overlay),
    });
}

export async function toggleUnitStatusAsOwner(
    unitId: number | string,
    body: UnitStatusPatchBody,
): Promise<ApiMessage> {
    return apiJson<ApiMessage>(VisualMapApi.ownerUnitStatus(unitId), {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}
