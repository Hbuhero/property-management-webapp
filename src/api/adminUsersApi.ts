import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    AdminUserPageSchema,
    AdminUserStatsSchema,
    AdminUserRowSchema,
    type AdminUserListParams,
    type AdminUserUpdateBody,
} from '@/schemas/adminUser.schema';
import { z } from 'zod';

function buildUserListQuery(params?: AdminUserListParams): string {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.size != null) sp.set('size', String(params.size));
    if (params?.status != null && params.status !== '') sp.set('status', params.status);
    if (params?.role != null && params.role !== '') sp.set('role', params.role);
    if (params?.search != null && params.search.trim() !== '') sp.set('search', params.search.trim());
    const q = sp.toString();
    return q ? `?${q}` : '';
}

export async function fetchAdminUsersPage(params?: AdminUserListParams): Promise<AdminUserPage> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/users${buildUserListQuery(params)}`, {
        method: 'GET',
    });
    return AdminUserPageSchema.parse(raw);
}

export async function fetchAdminUserStats(): Promise<AdminUserStats> {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/users/stats`, { method: 'GET' });
    return AdminUserStatsSchema.parse(raw);
}

export async function fetchAdminUserById(id: number | string): Promise<AdminUserRow> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}`,
        { method: 'GET' },
    );
    return AdminUserRowSchema.parse(raw);
}

export async function updateAdminUser(
    id: number | string,
    body: AdminUserUpdateBody,
): Promise<AdminUserRow> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}`,
        {
            method: 'PUT',
            body: JSON.stringify(body),
        },
    );
    return AdminUserRowSchema.parse(raw);
}

const MessageSchema = z.object({ message: z.string() });

export async function enableAdminUser(id: number | string): Promise<void> {
    await apiJson<unknown>(`${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}/enable`, {
        method: 'POST',
    });
}

export async function disableAdminUser(id: number | string): Promise<void> {
    await apiJson<unknown>(`${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}/disable`, {
        method: 'POST',
    });
}

export async function suspendAdminUser(id: number | string): Promise<void> {
    await apiJson<unknown>(`${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}/suspend`, {
        method: 'POST',
    });
}

export async function deleteAdminUser(id: number | string): Promise<string> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/users/${encodeURIComponent(String(id))}`,
        { method: 'DELETE' },
    );
    return MessageSchema.parse(raw).message;
}
