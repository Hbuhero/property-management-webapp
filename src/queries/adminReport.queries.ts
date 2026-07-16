import { useMutation, useQuery } from '@tanstack/react-query';
import {
    downloadAdminActivityPdf,
    downloadAdminInvoicesPdf,
    downloadAdminSystemOverviewPdf,
    downloadAdminUsersPdf,
    fetchAdminReportSummary,
} from '@/api/adminReportApi';
import { triggerBlobDownload } from '@/lib/apiClient';
import { showError, showSuccess } from '@/lib/toast';
import type { AdminReportFilters } from '@/schemas/adminReport.schema';

export const adminReportKeys = {
    all: ['admin-reports'] as const,
    summary: (filters?: AdminReportFilters) => [...adminReportKeys.all, 'summary', filters ?? {}] as const,
};

export function useAdminReportSummary(filters?: AdminReportFilters) {
    return useQuery({
        queryKey: adminReportKeys.summary(filters),
        queryFn: () => fetchAdminReportSummary(filters),
        staleTime: 30_000,
    });
}

async function downloadAndSave(
    resultPromise: Promise<{ blob: Blob; filename: string }>,
): Promise<void> {
    const result = await resultPromise;
    triggerBlobDownload(result.blob, result.filename);
}

function useAdminPdfDownload(
    downloadFn: (filters?: AdminReportFilters) => Promise<{ blob: Blob; filename: string }>,
    successMessage: string,
) {
    return useMutation({
        mutationFn: (filters?: AdminReportFilters) => downloadAndSave(downloadFn(filters)),
        onSuccess: () => showSuccess(successMessage),
        onError: (error: unknown) =>
            showError(error instanceof Error ? error.message : 'Could not download PDF'),
    });
}

export function useDownloadAdminSystemOverviewPdf() {
    return useAdminPdfDownload(downloadAdminSystemOverviewPdf, 'System overview PDF downloaded.');
}

export function useDownloadAdminUsersPdf() {
    return useAdminPdfDownload(downloadAdminUsersPdf, 'Users report PDF downloaded.');
}

export function useDownloadAdminActivityPdf() {
    return useAdminPdfDownload(downloadAdminActivityPdf, 'Activity report PDF downloaded.');
}

export function useDownloadAdminInvoicesPdf() {
    return useAdminPdfDownload(downloadAdminInvoicesPdf, 'Invoices report PDF downloaded.');
}
