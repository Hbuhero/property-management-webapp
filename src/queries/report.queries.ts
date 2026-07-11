import { useMutation } from '@tanstack/react-query';
import {
    downloadFinancialSummaryPdf,
    downloadInvoiceListPdf,
    downloadInvoicePdf,
    downloadLeaseContractPdf,
    downloadMaintenanceListPdf,
    downloadMaintenancePdf,
} from '@/api/reportApi';
import { triggerBlobDownload } from '@/lib/apiClient';
import { showError, showSuccess } from '@/lib/toast';
import type {
    FinancialSummaryReportFilters,
    InvoiceReportFilters,
    MaintenanceReportFilters,
} from '@/schemas/report.schema';

async function downloadAndSave(
    resultPromise: Promise<{ blob: Blob; filename: string }>,
): Promise<void> {
    const result = await resultPromise;
    triggerBlobDownload(result.blob, result.filename);
}

function onDownloadError(error: unknown): void {
    showError(error instanceof Error ? error.message : 'Could not download PDF');
}

export function useDownloadLeaseContractPdf() {
    return useMutation({
        mutationFn: (id: number | string) => downloadAndSave(downloadLeaseContractPdf(id)),
        onSuccess: () => showSuccess('Lease contract PDF downloaded.'),
        onError: onDownloadError,
    });
}

export function useDownloadInvoicePdf() {
    return useMutation({
        mutationFn: (id: number | string) => downloadAndSave(downloadInvoicePdf(id)),
        onSuccess: () => showSuccess('Invoice PDF downloaded.'),
        onError: onDownloadError,
    });
}

export function useDownloadInvoiceListPdf() {
    return useMutation({
        mutationFn: (filters?: InvoiceReportFilters) =>
            downloadAndSave(downloadInvoiceListPdf(filters)),
        onSuccess: () => showSuccess('Invoice statement PDF downloaded.'),
        onError: onDownloadError,
    });
}

export function useDownloadMaintenancePdf() {
    return useMutation({
        mutationFn: (id: number | string) => downloadAndSave(downloadMaintenancePdf(id)),
        onSuccess: () => showSuccess('Maintenance PDF downloaded.'),
        onError: onDownloadError,
    });
}

export function useDownloadMaintenanceListPdf() {
    return useMutation({
        mutationFn: (filters?: MaintenanceReportFilters) =>
            downloadAndSave(downloadMaintenanceListPdf(filters)),
        onSuccess: () => showSuccess('Maintenance list PDF downloaded.'),
        onError: onDownloadError,
    });
}

export function useDownloadFinancialSummaryPdf() {
    return useMutation({
        mutationFn: (filters?: FinancialSummaryReportFilters) =>
            downloadAndSave(downloadFinancialSummaryPdf(filters)),
        onSuccess: () => showSuccess('Financial summary PDF downloaded.'),
        onError: onDownloadError,
    });
}
