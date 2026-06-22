import { Link } from 'react-router-dom';
import { CalendarClock, CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceListTable } from '@/components/invoices/InvoiceListTable';
import { buildScheduleEntries } from '@/lib/leaseSchedule';
import {
    earliestInvoiceDueDate,
    nextScheduleDueLabel,
    sumPendingInvoiceAmount,
} from '@/lib/tenantBilling';
import { useInvoices } from '@/queries/invoice.queries';
import type { LeaseContract } from '@/schemas/leaseContract.schema';

type Props = {
    contract: LeaseContract;
    onRequestInvoice?: () => void;
    compact?: boolean;
};

export function TenantActiveTenancyPanel({ contract, onRequestInvoice, compact = false }: Props) {
    const invoicesQuery = useInvoices({ leaseContractId: contract.id });
    const invoices = invoicesQuery.data ?? [];
    const pending = invoices.filter((invoice) => invoice.status === 'PENDING');
    const recent = [...invoices]
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
        .slice(0, compact ? 3 : 5);

    const outstanding = sumPendingInvoiceAmount(invoices);
    const nextInvoiceDue = earliestInvoiceDueDate(invoices);
    const scheduleEntries = buildScheduleEntries(contract);
    const nextScheduleDue = nextScheduleDueLabel(scheduleEntries);
    const nextDue = nextInvoiceDue ?? nextScheduleDue;
    const currency = pending[0]?.currency ?? invoices[0]?.currency ?? 'TZS';

    return (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        Active tenancy
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">
                        {contract.property.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {contract.unit?.unitNumber ? `Unit ${contract.unit.unitNumber}` : 'Lease in progress'}
                        {' · '}
                        {formatInvoiceDate(contract.startDate)} – {formatInvoiceDate(contract.endDate)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" asChild>
                        <Link to="/tenant/payments">
                            <CreditCard className="h-4 w-4" />
                            Payments
                        </Link>
                    </Button>
                    {onRequestInvoice ? (
                        <Button
                            type="button"
                            onClick={onRequestInvoice}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" />
                            Request invoice
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase text-slate-500">Outstanding</p>
                    <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                        {formatInvoiceMoney(outstanding, currency)}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase text-slate-500">Next due</p>
                    <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-slate-950 dark:text-white">
                        <CalendarClock className="h-4 w-4 text-emerald-600" />
                        {nextDue ? formatInvoiceDate(nextDue) : '—'}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase text-slate-500">Payment day</p>
                    <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                        Day {contract.paymentDayOfMonth ?? 1}
                    </p>
                </div>
            </div>

            {!compact && recent.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-emerald-200/80 bg-white p-4 dark:border-emerald-900 dark:bg-slate-950">
                    <p className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">Recent invoices</p>
                    <InvoiceListTable
                        invoices={recent}
                        isLoading={invoicesQuery.isPending}
                        emptyMessage="No invoices yet."
                    />
                </div>
            ) : null}
        </section>
    );
}
