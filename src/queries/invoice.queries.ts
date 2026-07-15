import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
    createManualInvoice,
    demoBankNotify,
    fetchBillablePeriods,
    fetchInvoice,
    fetchInvoicePage,
    fetchPaymentStatus,
    initiatePayment,
    markInvoicePaid,
} from '@/api/invoiceApi';
import { leaseContractKeys } from '@/queries/leaseContract.queries';
import type {
    CreateManualInvoiceInput,
    InvoiceListFilters,
} from '@/schemas/invoice.schema';

export const invoiceKeys = {
    all: ['invoices'] as const,
    list: (filters?: InvoiceListFilters) =>
        [
            ...invoiceKeys.all,
            'list',
            filters?.status ?? 'all',
            filters?.leaseContractId ?? 'all',
            filters?.from ?? '',
            filters?.to ?? '',
            filters?.page ?? 'all',
            filters?.size ?? 'all',
            filters?.sortBy ?? 'dueDate',
            filters?.sortDirection ?? 'DESC',
        ] as const,
    detail: (id: number | string) => [...invoiceKeys.all, 'detail', String(id)] as const,
    paymentStatus: (id: number | string) =>
        [...invoiceKeys.all, 'payment-status', String(id)] as const,
    billablePeriods: (contractId: number | string) =>
        ['billable-periods', String(contractId)] as const,
};

/** Full page payload (records + pagination meta). */
export function useInvoicePage(filters?: InvoiceListFilters) {
    return useQuery({
        queryKey: invoiceKeys.list(filters),
        queryFn: () => fetchInvoicePage(filters),
    });
}

/** Records-only convenience — shares cache with {@link useInvoicePage}. */
export function useInvoices(filters?: InvoiceListFilters) {
    return useQuery({
        queryKey: invoiceKeys.list(filters),
        queryFn: () => fetchInvoicePage(filters),
        select: (page) => page.records,
    });
}

export function useInvoice(id: number | string | undefined) {
    return useQuery({
        queryKey: id != null ? invoiceKeys.detail(id) : [...invoiceKeys.all, 'detail', 'missing'],
        queryFn: () => fetchInvoice(id as number | string),
        enabled: id != null,
    });
}

export function useBillablePeriods(contractId: number | string | undefined) {
    return useQuery({
        queryKey:
            contractId != null
                ? invoiceKeys.billablePeriods(contractId)
                : ['billable-periods', 'missing'],
        queryFn: () => fetchBillablePeriods(contractId as number | string),
        enabled: contractId != null,
    });
}

type PaymentStatusOptions = {
    /** When false, the query does not run. Default: true when id is set. */
    enabled?: boolean;
    /** Poll interval while waiting for gateway confirmation. Use `false` to disable. */
    refetchInterval?: number | false;
};

/**
 * Polls {@code GET /invoices/{id}/payment-status}.
 * Typical usage: enable while the online-pay dialog is open and status is still pending.
 */
export function usePaymentStatus(
    id: number | string | undefined,
    options?: PaymentStatusOptions,
) {
    const enabled = id != null && (options?.enabled ?? true);
    return useQuery({
        queryKey: id != null ? invoiceKeys.paymentStatus(id) : [...invoiceKeys.all, 'payment-status', 'missing'],
        queryFn: () => fetchPaymentStatus(id as number | string),
        enabled,
        refetchInterval: options?.refetchInterval ?? false,
    });
}

function invalidateInvoiceSurfaces(qc: QueryClient, contractId?: number) {
    void qc.invalidateQueries({ queryKey: invoiceKeys.all });
    void qc.invalidateQueries({ queryKey: leaseContractKeys.all });
    if (contractId != null) {
        void qc.invalidateQueries({ queryKey: invoiceKeys.billablePeriods(contractId) });
    }
}

export function useCreateManualInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateManualInvoiceInput) => createManualInvoice(body),
        onSuccess: (_data, variables) => {
            invalidateInvoiceSurfaces(qc, variables.leaseContractId);
        },
    });
}

export function useInitiatePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => initiatePayment(id),
        onSuccess: (data) => {
            invalidateInvoiceSurfaces(qc, data.contract?.id);
            void qc.invalidateQueries({ queryKey: invoiceKeys.paymentStatus(data.id) });
        },
    });
}

export function useDemoBankNotify() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => demoBankNotify(id),
        onSuccess: (data) => {
            invalidateInvoiceSurfaces(qc, data.invoice.contract?.id);
            void qc.invalidateQueries({ queryKey: invoiceKeys.paymentStatus(data.invoice.id) });
        },
    });
}

export function useMarkInvoicePaid() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => markInvoicePaid(id),
        onSuccess: (data) => {
            invalidateInvoiceSurfaces(qc, data.contract?.id);
        },
    });
}
