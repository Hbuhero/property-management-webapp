import { apiBlob, apiJson, type ApiBlobResult } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import {
    AdminSystemSummarySchema,
    type AdminReportFilters,
    type AdminSystemSummary,
} from '@/schemas/adminReport.schema';

const ADMIN_REPORTS = `${API_V1_PREFIX}/admin/reports`;

function toQuery(params: Record<string, string | number | undefined | null>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value == null || value === '') continue;
        search.set(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : '';
}

export async function fetchAdminReportSummary(
    filters?: AdminReportFilters,
): Promise<AdminSystemSummary> {
    const raw = await apiJson<unknown>(
        `${ADMIN_REPORTS}/summary${toQuery({
            from: filters?.from,
            to: filters?.to,
            activityLimit: filters?.activityLimit,
        })}`,
        { method: 'GET' },
    );
    return AdminSystemSummarySchema.parse(raw);
}

export async function downloadAdminSystemOverviewPdf(
    filters?: AdminReportFilters,
): Promise<ApiBlobResult> {
    return apiBlob(
        `${ADMIN_REPORTS}/system-overview.pdf${toQuery({ from: filters?.from, to: filters?.to })}`,
        { method: 'GET', fallbackFilename: 'system-overview.pdf' },
    );
}

export async function downloadAdminUsersPdf(filters?: AdminReportFilters): Promise<ApiBlobResult> {
    return apiBlob(
        `${ADMIN_REPORTS}/users.pdf${toQuery({ from: filters?.from, to: filters?.to })}`,
        { method: 'GET', fallbackFilename: 'admin-users.pdf' },
    );
}

export async function downloadAdminActivityPdf(filters?: AdminReportFilters): Promise<ApiBlobResult> {
    return apiBlob(
        `${ADMIN_REPORTS}/activity.pdf${toQuery({ from: filters?.from, to: filters?.to })}`,
        { method: 'GET', fallbackFilename: 'admin-activity.pdf' },
    );
}

export async function downloadAdminInvoicesPdf(filters?: AdminReportFilters): Promise<ApiBlobResult> {
    return apiBlob(
        `${ADMIN_REPORTS}/invoices.pdf${toQuery({
            from: filters?.from,
            to: filters?.to,
            status: filters?.status,
        })}`,
        { method: 'GET', fallbackFilename: 'admin-invoices.pdf' },
    );
}
