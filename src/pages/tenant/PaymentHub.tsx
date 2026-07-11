import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceListWithDetail } from '@/components/invoices/InvoiceListWithDetail';
import { MobilePayDialog } from '@/components/invoices/MobilePayDialog';
import { RequestInvoiceDialog } from '@/components/invoices/RequestInvoiceDialog';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { earliestInvoiceDueDate, sumPendingInvoiceAmount } from '@/lib/tenantBilling';
import { useInvoices } from '@/queries/invoice.queries';
import { useLeaseContracts } from '@/queries/leaseContract.queries';
import {
    useDownloadInvoiceListPdf,
    useDownloadInvoicePdf,
} from '@/queries/report.queries';
import type { Invoice } from '@/schemas/invoice.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const PaymentHub = () => {
    const { t } = useTranslation();
    const pendingQuery = useInvoices({ status: 'PENDING' });
    const contractsQuery = useLeaseContracts();
    const downloadInvoice = useDownloadInvoicePdf();
    const downloadInvoiceList = useDownloadInvoiceListPdf();
    const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
    const [requestOpen, setRequestOpen] = useState(false);

    const activeContract = useMemo(
        () => (contractsQuery.data ?? []).find((contract) => contract.status === 'ACCEPTED'),
        [contractsQuery.data],
    );

    const pending = pendingQuery.data ?? [];
    const balanceDue = sumPendingInvoiceAmount(pending);
    const nextDue = earliestInvoiceDueDate(pending);
    const currency = pending[0]?.currency ?? 'TZS';

    const mobilePending = pending.filter((invoice) => invoice.paymentMethod === 'MOBILE');

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-4xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Hub</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Pay mobile invoices or request a manual bill for your active lease.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <DownloadReportButton
                        label={t('reports.exportInvoices')}
                        isLoading={downloadInvoiceList.isPending}
                        onDownload={() => downloadInvoiceList.mutateAsync({ status: 'PENDING' })}
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
                    <p className="mb-1 text-sm text-emerald-100">Balance due</p>
                    <h3 className="text-4xl font-bold text-white">
                        {pendingQuery.isPending
                            ? '…'
                            : formatInvoiceMoney(balanceDue, currency)}
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
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <h2 className="font-semibold text-slate-950 dark:text-white">Outstanding invoices</h2>
                    <p className="text-sm text-slate-500">
                        {pending.length} pending {pending.length === 1 ? 'invoice' : 'invoices'}
                    </p>
                </div>
                <div className="p-4">
                    {pendingQuery.isError ? (
                        <p className="text-sm text-red-600">
                            {pendingQuery.error instanceof Error
                                ? pendingQuery.error.message
                                : 'Could not load invoices'}
                        </p>
                    ) : (
                        <InvoiceListWithDetail
                            invoices={pending}
                            isLoading={pendingQuery.isPending}
                            emptyMessage="No pending invoices. You're all caught up."
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
                                    {invoice.paymentMethod === 'MOBILE' ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            onClick={() => setPayInvoice(invoice)}
                                        >
                                            Pay
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-slate-500">Cash · owner confirms</span>
                                    )}
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
                                    {invoice.paymentMethod === 'MOBILE' ? (
                                        <Button
                                            type="button"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            onClick={() => setPayInvoice(invoice)}
                                        >
                                            Pay with mobile money
                                        </Button>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            Cash invoice — your landlord will mark this paid after
                                            payment.
                                        </p>
                                    )}
                                </div>
                            )}
                        />
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

            <MobilePayDialog
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
