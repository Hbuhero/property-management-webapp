import type { InvoiceStatus } from '@/schemas/invoice.schema';
import type {
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceStatus,
} from '@/schemas/maintenance.schema';

/** Optional date-range + domain filters for PDF list / summary exports. */
export type ReportDateRange = {
    from?: string;
    to?: string;
};

export type InvoiceReportFilters = ReportDateRange & {
    status?: InvoiceStatus;
    leaseContractId?: number;
};

export type MaintenanceReportFilters = ReportDateRange & {
    status?: MaintenanceStatus;
    category?: MaintenanceCategory;
    priority?: MaintenancePriority;
    propertyId?: number;
};

export type FinancialSummaryReportFilters = ReportDateRange & {
    propertyId?: number;
};
