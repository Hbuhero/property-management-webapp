import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    CreateLeaseContractSchema,
    LeaseContractSchema,
    TenantAcceptContractSchema,
    TenantRejectContractSchema,
    type CreateLeaseContractInput,
    type LeaseContract,
    type TenantAcceptContractInput,
    type TenantRejectContractInput,
} from '@/schemas/leaseContract.schema';

function contractPath(id?: number | string): string {
    const base = `${API_V1_PREFIX}/lease-contracts`;
    return id == null ? base : `${base}/${encodeURIComponent(String(id))}`;
}

export async function fetchLeaseContracts(): Promise<LeaseContract[]> {
    const raw = await apiJson<unknown>(contractPath(), { method: 'GET' });
    return z.array(LeaseContractSchema).parse(raw);
}

export async function createLeaseContract(body: CreateLeaseContractInput): Promise<LeaseContract> {
    CreateLeaseContractSchema.parse(body);
    const raw = await apiJson<unknown>(contractPath(), {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return LeaseContractSchema.parse(raw);
}

export async function updateLeaseContract(
    id: number | string,
    body: CreateLeaseContractInput,
): Promise<LeaseContract> {
    CreateLeaseContractSchema.parse(body);
    const raw = await apiJson<unknown>(contractPath(id), {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return LeaseContractSchema.parse(raw);
}

export async function sendLeaseContract(id: number | string): Promise<LeaseContract> {
    const raw = await apiJson<unknown>(`${contractPath(id)}/send`, { method: 'PUT' });
    return LeaseContractSchema.parse(raw);
}

export async function acceptLeaseContract(
    id: number | string,
    body: TenantAcceptContractInput,
): Promise<LeaseContract> {
    TenantAcceptContractSchema.parse(body);
    const raw = await apiJson<unknown>(`${contractPath(id)}/tenant-accept`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return LeaseContractSchema.parse(raw);
}

export async function rejectLeaseContract(
    id: number | string,
    body: TenantRejectContractInput,
): Promise<LeaseContract> {
    TenantRejectContractSchema.parse(body);
    const raw = await apiJson<unknown>(`${contractPath(id)}/tenant-reject`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    return LeaseContractSchema.parse(raw);
}
