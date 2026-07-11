import { z } from 'zod';
import { apiJson } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    BillablePeriodSchema,
    CreateManualInvoiceSchema,
    InvoicePageSchema,
    InvoiceSchema,
    type CreateManualInvoiceInput,
    type Invoice,
    type InvoiceListFilters,
    type InvoicePage,
    type BillablePeriod,
} from '@/schemas/invoice.schema';

function invoicePath(id?: number | string): string {
    const base = `${API_V1_PREFIX}/invoices`;
    return id == null ? base : `${base}/${encodeURIComponent(String(id))}`;
}

function listQuery(filters?: InvoiceListFilters): string {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.leaseContractId != null) {
        params.set('leaseContractId', String(filters.leaseContractId));
    }
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.page != null) params.set('page', String(filters.page));
    if (filters.size != null) params.set('size', String(filters.size));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params.set('sortDirection', filters.sortDirection);
    const query = params.toString();
    return query ? `?${query}` : '';
}

/** Paginated invoice list (`{ page, records }`). Omit page/size for a large unpaged window. */
export async function fetchInvoicePage(filters?: InvoiceListFilters): Promise<InvoicePage> {
    const raw = await apiJson<unknown>(`${invoicePath()}${listQuery(filters)}`, { method: 'GET' });
    return InvoicePageSchema.parse(raw);
}

/** Convenience: returns only `records` from {@link fetchInvoicePage}. */
export async function fetchInvoices(filters?: InvoiceListFilters): Promise<Invoice[]> {
    const page = await fetchInvoicePage(filters);
    return page.records;
}

export async function fetchInvoice(id: number | string): Promise<Invoice> {
    const raw = await apiJson<unknown>(invoicePath(id), { method: 'GET' });
    return InvoiceSchema.parse(raw);
}

export async function fetchBillablePeriods(contractId: number | string): Promise<BillablePeriod[]> {
    const raw = await apiJson<unknown>(
        `${API_V1_PREFIX}/lease-contracts/${encodeURIComponent(String(contractId))}/billable-periods`,
        { method: 'GET' },
    );
    return z.array(BillablePeriodSchema).parse(raw);
}

export async function createManualInvoice(body: CreateManualInvoiceInput): Promise<Invoice> {
    CreateManualInvoiceSchema.parse(body);
    const raw = await apiJson<unknown>(invoicePath(), {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return InvoiceSchema.parse(raw);
}

export async function payMobileInvoice(id: number | string): Promise<Invoice> {
    const raw = await apiJson<unknown>(`${invoicePath(id)}/pay-mobile`, { method: 'POST' });
    return InvoiceSchema.parse(raw);
}

export async function markInvoicePaid(id: number | string): Promise<Invoice> {
    const raw = await apiJson<unknown>(`${invoicePath(id)}/mark-paid`, {
        method: 'PUT',
        body: JSON.stringify({}),
    });
    return InvoiceSchema.parse(raw);
}
