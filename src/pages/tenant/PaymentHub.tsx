import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceListPagination } from '@/components/invoices/InvoiceListPagination';
import { InvoiceListWithDetail } from '@/components/invoices/InvoiceListWithDetail';
import { InvoiceStatusFilter } from '@/components/invoices/InvoiceStatusFilter';
import { OnlinePaymentDialog } from '@/components/invoices/OnlinePaymentDialog';
import { RequestInvoiceDialog } from '@/components/invoices/RequestInvoiceDialog';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { earliestInvoiceDueDate, sumPendingInvoiceAmount } from '@/lib/tenantBilling';
import { useInvoicePage, useInvoices } from '@/queries/invoice.queries';
import { useLeaseContracts } from '@/queries/leaseContract.queries';
import {
    useDownloadInvoiceListPdf,
    useDownloadInvoicePdf,
} from '@/queries/report.queries';
import type { Invoice, InvoiceListFilters, InvoiceStatusFilterValue } from '@/schemas/invoice.schema';

const PAGE_SIZE = 10;

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

function toIsoDate(value: Date | undefined): string | undefined {
    if (!value) return undefined;
    return format(value, 'yyyy-MM-dd');
}

const PaymentHub = () => {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilterValue>('ALL');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(1);
    const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
    const [requestOpen, setRequestOpen] = useState(false);

    const contractsQuery = useLeaseContracts();
    const pendingQuery = useInvoices({ status: 'PENDING' });
    const downloadInvoice = useDownloadInvoicePdf();
    const downloadInvoiceList = useDownloadInvoiceListPdf();

    const historyFilters = useMemo<InvoiceListFilters>(() => {
        const filters: InvoiceListFilters = {
            page,
            size: PAGE_SIZE,
            sortBy: 'dueDate',
            sortDirection: 'DESC',
        };
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        const from = toIsoDate(dateRange?.from);
        const to = toIsoDate(dateRange?.to);
        if (from) filters.from = from;
        if (to) filters.to = to;
        return filters;
    }, [statusFilter, dateRange, page]);

    const historyQuery = useInvoicePage(historyFilters);

    const activeContract = useMemo(
        () => (contractsQuery.data ?? []).find((contract) => contract.status === 'ACCEPTED'),
        [contractsQuery.data],
    );

    const pending = pendingQuery.data ?? [];
    const history = historyQuery.data?.records ?? [];
    const pageCountRaw = Number(historyQuery.data?.page.pageCount ?? '0');
    const resolvedTotalPages = Number.isFinite(pageCountRaw) ? Math.max(1, pageCountRaw + 1) : 1;

    const balanceDue = sumPendingInvoiceAmount(pending);
    const nextDue = earliestInvoiceDueDate(pending);
    const currency = pending[0]?.currency ?? history[0]?.currency ?? 'TZS';
    const mobilePending = pending.filter((invoice) => invoice.paymentMethod === 'MOBILE');

    const exportFilters = useMemo(() => {
        const filters: { status?: Invoice['status']; from?: string; to?: string } = {};
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        const from = toIsoDate(dateRange?.from);
        const to = toIsoDate(dateRange?.to);
        if (from) filters.from = from;
        if (to) filters.to = to;
        return filters;
    }, [statusFilter, dateRange]);

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Hub</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pay online invoices or request a manual bill for your active lease.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <DownloadReportButton
                        label={t('reports.exportInvoices')}
                        isLoading={downloadInvoiceList.isPending}
                        onDownload={() => downloadInvoiceList.mutateAsync(exportFilters)}
                    />
                    {activeContract ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRequestOpen(true)}
                            className="w-fit"
                        >
                            <Plus className="h-4 w-4" />
                            Request invoice
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="bg-emerald-600 p-6">
                    <p className="mb-1 text-sm text-emerald-100">{t('invoices.outstandingTitle')}</p>
                    <h3 className="text-4xl font-bold text-white">
                        {pendingQuery.isPending ? '…' : formatInvoiceMoney(balanceDue, currency)}
                    </h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-100">
                        <Clock className="h-4 w-4" />
                        {nextDue
                            ? `Next due ${formatInvoiceDate(nextDue)}`
                            : pending.length === 0
                              ? 'No outstanding invoices'
                              : 'Due dates vary by line item'}
                    </p>
                </div>

                {mobilePending.length === 1 ? (
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <Button
                            type="button"
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => setPayInvoice(mobilePending[0])}
                        >
                            Pay {formatInvoiceMoney(mobilePending[0].amount, mobilePending[0].currency)} now
                        </Button>
                    </div>
                ) : null}
            </div>

            {!activeContract && !contractsQuery.isPending ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    You need an accepted lease before requesting new invoices.{' '}
                    <Link to="/tenant/lease" className="font-semibold underline">
                        View lease desk
                    </Link>
                </p>
            ) : null}

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-950 dark:text-white">
                                {t('invoices.historyTitle')}
                            </h2>
                            <p className="text-sm text-slate-500">{t('invoices.historySubtitle')}</p>
                        </div>
                        <InvoiceStatusFilter
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="min-w-[260px] flex-1">
                            <DateRangePicker
                                date={dateRange}
                                setDate={(range) => {
                                    setDateRange(range);
                                    setPage(1);
                                }}
                            />
                        </div>
                        {dateRange?.from ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setDateRange(undefined);
                                    setPage(1);
                                }}
                            >
                                {t('invoices.clearDates')}
                            </Button>
                        ) : null}
                    </div>
                </div>
                <div className="p-4">
                    {historyQuery.isError ? (
                        <p className="text-sm text-red-600">
                            {historyQuery.error instanceof Error
                                ? historyQuery.error.message
                                : 'Could not load invoices'}
                        </p>
                    ) : (
                        <>
                            <InvoiceListWithDetail
                                invoices={history}
                                isLoading={historyQuery.isPending}
                                emptyMessage={t('invoices.emptyHistory')}
                                renderActions={(invoice) => (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <DownloadReportButton
                                            size="sm"
                                            hideIcon
                                            label={t('reports.downloadInvoice')}
                                            isLoading={
                                                downloadInvoice.isPending &&
                                                downloadInvoice.variables === invoice.id
                                            }
                                            onDownload={() => downloadInvoice.mutateAsync(invoice.id)}
                                        />
                                        {invoice.status === 'PENDING' &&
                                        invoice.paymentMethod === 'MOBILE' ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => setPayInvoice(invoice)}
                                            >
                                                Pay online
                                            </Button>
                                        ) : invoice.status === 'PENDING' ? (
                                            <span className="text-xs text-slate-500">Cash · owner confirms</span>
                                        ) : null}
                                    </div>
                                )}
                                renderDetailActions={(invoice) => (
                                    <div className="flex flex-col gap-2">
                                        <DownloadReportButton
                                            label={t('reports.downloadInvoice')}
                                            isLoading={
                                                downloadInvoice.isPending &&
                                                downloadInvoice.variables === invoice.id
                                            }
                                            onDownload={() => downloadInvoice.mutateAsync(invoice.id)}
                                        />
                                        {invoice.status === 'PENDING' &&
                                        invoice.paymentMethod === 'MOBILE' ? (
                                            <Button
                                                type="button"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => setPayInvoice(invoice)}
                                            >
                                                Pay online
                                            </Button>
                                        ) : invoice.status === 'PENDING' ? (
                                            <p className="text-sm text-slate-500">
                                                Cash invoice — your landlord will mark this paid after
                                                payment.
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            />
                            <InvoiceListPagination
                                page={page}
                                totalPages={resolvedTotalPages}
                                disabled={historyQuery.isPending}
                                onPageChange={setPage}
                            />
                        </>
                    )}
                </div>
            </section>

            {activeContract ? (
                <RequestInvoiceDialog
                    leaseContractId={activeContract.id}
                    open={requestOpen}
                    onOpenChange={setRequestOpen}
                />
            ) : null}

            <OnlinePaymentDialog
                invoice={payInvoice}
                open={payInvoice != null}
                onOpenChange={(open) => {
                    if (!open) setPayInvoice(null);
                }}
            />
        </motion.div>
    );
};

export default PaymentHub;
