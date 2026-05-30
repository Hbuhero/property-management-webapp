import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    ApplicationSchema,
    CreateApplicationSchema,
    RejectApplicationSchema,
    type ApplicationStatus,
    type CreateApplicationInput,
    type PropertyApplication,
    type RejectApplicationInput,
} from '@/schemas/application.schema';

function applicationPath(id?: number | string): string {
    const base = `${API_V1_PREFIX}/applications`;
    return id == null ? base : `${base}/${encodeURIComponent(String(id))}`;
}

export async function fetchApplications(status?: ApplicationStatus): Promise<PropertyApplication[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const raw = await apiJson<unknown>(`${applicationPath()}${query}`, { method: 'GET' });
    return z.array(ApplicationSchema).parse(raw);
}

export async function fetchApplication(id: number | string): Promise<PropertyApplication> {
    const raw = await apiJson<unknown>(applicationPath(id), { method: 'GET' });
    return ApplicationSchema.parse(raw);
}

export async function createApplication(body: CreateApplicationInput): Promise<PropertyApplication> {
    CreateApplicationSchema.parse(body);
    const raw = await apiJson<unknown>(applicationPath(), {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return ApplicationSchema.parse(raw);
}

export async function approveApplication(id: number | string): Promise<PropertyApplication> {
    const raw = await apiJson<unknown>(`${applicationPath(id)}/approve`, { method: 'PUT' });
    return ApplicationSchema.parse(raw);
}

export async function rejectApplication(
    id: number | string,
    body: RejectApplicationInput,
): Promise<PropertyApplication> {
    RejectApplicationSchema.parse(body);
    const raw = await apiJson<unknown>(`${applicationPath(id)}/reject`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return ApplicationSchema.parse(raw);
}

export async function withdrawApplication(id: number | string): Promise<PropertyApplication> {
    const raw = await apiJson<unknown>(`${applicationPath(id)}/withdraw`, { method: 'PUT' });
    return ApplicationSchema.parse(raw);
}

export async function deleteApplication(id: number | string): Promise<void> {
    await apiJson<unknown>(applicationPath(id), { method: 'DELETE' });
}
