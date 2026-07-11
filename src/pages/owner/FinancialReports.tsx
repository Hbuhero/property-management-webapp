import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { DateRange } from 'react-day-picker';
import { PageBackLink } from '@/components/dashboard/PageBackLink';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceListPagination } from '@/components/invoices/InvoiceListPagination';
import { InvoiceListWithDetail } from '@/components/invoices/InvoiceListWithDetail';
import { InvoiceStatusFilter } from '@/components/invoices/InvoiceStatusFilter';
import { MarkPaidConfirmDialog } from '@/components/invoices/MarkPaidConfirmDialog';
import { OwnerFinancesNav } from '@/components/invoices/OwnerFinancesNav';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { paidRevenueByMonth, sumPaidInvoiceAmount } from '@/lib/invoiceAnalytics';
import { sumPendingInvoiceAmount } from '@/lib/tenantBilling';
import { useInvoicePage, useInvoices } from '@/queries/invoice.queries';
import {
    useDownloadFinancialSummaryPdf,
    useDownloadInvoiceListPdf,
    useDownloadInvoicePdf,
} from '@/queries/report.queries';
import type {
    Invoice,
    InvoiceListFilters,
    InvoiceStatusFilterValue,
} from '@/schemas/invoice.schema';

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

function totalPagesFromMeta(pageCount: string | undefined): number {
    const raw = Number(pageCount ?? '0');
    if (!Number.isFinite(raw)) return 1;
    // Backend stores pageCount as totalPages - 1 (see Pagination.java).
    return Math.max(1, raw + 1);
}

const FinancialReports = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const [searchParams] = useSearchParams();
    const contractFilter = searchParams.get('leaseContractId');
    const leaseContractId = contractFilter ? Number(contractFilter) : undefined;
    const leaseScope =
        leaseContractId != null && Number.isFinite(leaseContractId)
            ? { leaseContractId }
            : undefined;

    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilterValue>('ALL');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(1);
    const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);

    const pendingQuery = useInvoices({ status: 'PENDING', ...leaseScope });
    const paidQuery = useInvoices({ status: 'PAID', ...leaseScope });

    const historyFilters = useMemo<InvoiceListFilters>(() => {
        const filters: InvoiceListFilters = {
            page,
            size: PAGE_SIZE,
            sortBy: 'dueDate',
            sortDirection: 'DESC',
            ...leaseScope,
        };
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        const from = toIsoDate(dateRange?.from);
        const to = toIsoDate(dateRange?.to);
        if (from) filters.from = from;
        if (to) filters.to = to;
        return filters;
    }, [statusFilter, dateRange, page, leaseScope?.leaseContractId]);

    const historyQuery = useInvoicePage(historyFilters);

    const downloadInvoice = useDownloadInvoicePdf();
    const downloadInvoiceList = useDownloadInvoiceListPdf();
    const downloadFinancialSummary = useDownloadFinancialSummaryPdf();

    const pending = useMemo(() => pendingQuery.data ?? [], [pendingQuery.data]);
    const paid = useMemo(() => paidQuery.data ?? [], [paidQuery.data]);
    const history = historyQuery.data?.records ?? [];
    const resolvedTotalPages = totalPagesFromMeta(historyQuery.data?.page.pageCount);

    const chartData = useMemo(() => paidRevenueByMonth(paid), [paid]);
    const totalPaid = sumPaidInvoiceAmount(paid);
    const totalOutstanding = sumPendingInvoiceAmount(pending);
    const currency = pending[0]?.currency ?? paid[0]?.currency ?? history[0]?.currency ?? 'TZS';

    const listExportFilters = useMemo(() => {
        const filters: {
            status?: Invoice['status'];
            leaseContractId?: number;
            from?: string;
            to?: string;
        } = { ...leaseScope };
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        const from = toIsoDate(dateRange?.from);
        const to = toIsoDate(dateRange?.to);
        if (from) filters.from = from;
        if (to) filters.to = to;
        return filters;
    }, [statusFilter, dateRange, leaseScope?.leaseContractId]);

    return (
        <motion.div {...fadeUp} className="space-y-6">
            {leaseContractId != null && Number.isFinite(leaseContractId) ? (
                <PageBackLink to={`${base}/finances`} label="Back to all reports" />
            ) : null}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial reports</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Revenue from paid invoices and outstanding tenant balances.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DownloadReportButton
                        label={t('reports.exportFinancialSummary')}
                        isLoading={downloadFinancialSummary.isPending}
                        onDownload={() => downloadFinancialSummary.mutateAsync(undefined)}
                    />
                    <DownloadReportButton
                        label={t('reports.exportInvoices')}
                        isLoading={downloadInvoiceList.isPending}
                        onDownload={() => downloadInvoiceList.mutateAsync(listExportFilters)}
                    />
                    <OwnerFinancesNav />
                </div>
            </div>

            {leaseContractId != null && Number.isFinite(leaseContractId) ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Filtered to lease #{leaseContractId}.{' '}
                    <Link to={`${base}/finances`} className="font-semibold text-emerald-600 hover:underline">
                        Clear filter
                    </Link>
                </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase text-slate-500">Collected (paid)</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                        {paidQuery.isPending ? '…' : formatInvoiceMoney(totalPaid, currency)}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase text-slate-500">Outstanding</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                        {pendingQuery.isPending ? '…' : formatInvoiceMoney(totalOutstanding, currency)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-5 font-semibold text-slate-900 dark:text-white">Paid revenue by month</h3>
                    <div className="h-[260px]">
                        {chartData.length === 0 ? (
                            <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                No paid invoices in the selected period yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            formatInvoiceMoney(
                                                typeof value === 'number' ? value : Number(value),
                                                currency,
                                            )
                                        }
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)',
                                        }}
                                    />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-5 font-semibold text-slate-900 dark:text-white">Outstanding balances</h3>
                    {pendingQuery.isError ? (
                        <p className="text-sm text-red-600">
                            {pendingQuery.error instanceof Error
                                ? pendingQuery.error.message
                                : 'Could not load outstanding invoices'}
                        </p>
                    ) : pending.length === 0 ? (
                        <p className="text-sm text-slate-500">No pending invoices right now.</p>
                    ) : (
                        <div className="space-y-3">
                            {pending.slice(0, 6).map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {invoice.contract?.tenantName ?? 'Tenant'}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                            Due {formatInvoiceDate(invoice.dueDate)} · {invoice.paymentMethod}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {formatInvoiceMoney(invoice.amount, invoice.currency)}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-[10px] font-bold text-emerald-600"
                                            onClick={() => setMarkPaidInvoice(invoice)}
                                        >
                                            MARK PAID
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                                        {invoice.status === 'PENDING' ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setMarkPaidInvoice(invoice)}
                                            >
                                                Mark paid
                                            </Button>
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
                                        {invoice.status === 'PENDING' ? (
                                            <Button
                                                type="button"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => setMarkPaidInvoice(invoice)}
                                            >
                                                Mark as paid
                                            </Button>
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                {t('invoices.markPaidOnlyPending')}
                                            </p>
                                        )}
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

            <MarkPaidConfirmDialog
                invoice={markPaidInvoice}
                open={markPaidInvoice != null}
                onOpenChange={(open) => {
                    if (!open) setMarkPaidInvoice(null);
                }}
            />
        </motion.div>
    );
};

export default FinancialReports;
