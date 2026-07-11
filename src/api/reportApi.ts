import { apiBlob, type ApiBlobResult } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import type {
    FinancialSummaryReportFilters,
    InvoiceReportFilters,
    MaintenanceReportFilters,
} from '@/schemas/report.schema';

const REPORTS = `${API_V1_PREFIX}/reports`;

function toQuery(params: Record<string, string | number | undefined | null>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value == null || value === '') continue;
        search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
}

export async function downloadLeaseContractPdf(id: number | string): Promise<ApiBlobResult> {
    return apiBlob(`${REPORTS}/lease-contracts/${encodeURIComponent(String(id))}.pdf`, {
        method: 'GET',
        fallbackFilename: `lease-contract-${id}.pdf`,
    });
}

export async function downloadInvoicePdf(id: number | string): Promise<ApiBlobResult> {
    return apiBlob(`${REPORTS}/invoices/${encodeURIComponent(String(id))}.pdf`, {
        method: 'GET',
        fallbackFilename: `invoice-${id}.pdf`,
    });
}

export async function downloadInvoiceListPdf(
    filters?: InvoiceReportFilters,
): Promise<ApiBlobResult> {
    return apiBlob(
        `${REPORTS}/invoices.pdf${toQuery({
            status: filters?.status,
            leaseContractId: filters?.leaseContractId,
            from: filters?.from,
            to: filters?.to,
        })}`,
        {
            method: 'GET',
            fallbackFilename: 'invoices.pdf',
        },
    );
}

export async function downloadMaintenancePdf(id: number | string): Promise<ApiBlobResult> {
    return apiBlob(`${REPORTS}/maintenance/${encodeURIComponent(String(id))}.pdf`, {
        method: 'GET',
        fallbackFilename: `maintenance-${id}.pdf`,
    });
}

export async function downloadMaintenanceListPdf(
    filters?: MaintenanceReportFilters,
): Promise<ApiBlobResult> {
    return apiBlob(
        `${REPORTS}/maintenance.pdf${toQuery({
            status: filters?.status,
            category: filters?.category,
            priority: filters?.priority,
            propertyId: filters?.propertyId,
            from: filters?.from,
            to: filters?.to,
        })}`,
        {
            method: 'GET',
            fallbackFilename: 'maintenance-list.pdf',
        },
    );
}

export async function downloadFinancialSummaryPdf(
    filters?: FinancialSummaryReportFilters,
): Promise<ApiBlobResult> {
    return apiBlob(
        `${REPORTS}/financial-summary.pdf${toQuery({
            from: filters?.from,
            to: filters?.to,
            propertyId: filters?.propertyId,
        })}`,
        {
            method: 'GET',
            fallbackFilename: 'financial-summary.pdf',
        },
    );
}
