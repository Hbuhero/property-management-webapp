import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    CreateMaintenanceSchema,
    MaintenanceRequestSchema,
    UpdateMaintenanceSchema,
    type CreateMaintenanceInput,
    type MaintenanceListFilters,
    type MaintenanceRequest,
    type UpdateMaintenanceInput,
} from '@/schemas/maintenance.schema';

function maintenancePath(id?: number | string): string {
    const base = `${API_V1_PREFIX}/maintenance`;
    return id == null ? base : `${base}/${encodeURIComponent(String(id))}`;
}

function buildMaintenanceQuery(filters?: MaintenanceListFilters): string {
    if (!filters) {
        return '';
    }
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.propertyId != null) params.set('propertyId', String(filters.propertyId));
    if (filters.floorUnitId != null) params.set('floorUnitId', String(filters.floorUnitId));
    if (filters.tenantId != null) params.set('tenantId', String(filters.tenantId));
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export async function fetchMaintenanceRequests(
    filters?: MaintenanceListFilters,
): Promise<MaintenanceRequest[]> {
    const raw = await apiJson<unknown>(`${maintenancePath()}${buildMaintenanceQuery(filters)}`, {
        method: 'GET',
    });
    return z.array(MaintenanceRequestSchema).parse(raw);
}

export async function fetchMaintenanceRequest(id: number | string): Promise<MaintenanceRequest> {
    const raw = await apiJson<unknown>(maintenancePath(id), { method: 'GET' });
    return MaintenanceRequestSchema.parse(raw);
}

export async function createMaintenance(body: CreateMaintenanceInput): Promise<MaintenanceRequest> {
    CreateMaintenanceSchema.parse(body);
    const raw = await apiJson<unknown>(maintenancePath(), {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return MaintenanceRequestSchema.parse(raw);
}

export async function updateMaintenance(
    id: number | string,
    body: UpdateMaintenanceInput,
): Promise<MaintenanceRequest> {
    UpdateMaintenanceSchema.parse(body);
    const raw = await apiJson<unknown>(maintenancePath(id), {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return MaintenanceRequestSchema.parse(raw);
}
