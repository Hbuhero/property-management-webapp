import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoice: Invoice;
    actions?: ReactNode;
};

export function InvoiceDetailCard({ invoice, actions }: Props) {
    const contract = invoice.contract;

    return (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-lg">
                        {invoice.item?.label ?? 'Invoice'}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                        {contract?.propertyTitle ?? 'Lease contract'}
                        {contract?.unitLabel ? ` · Unit ${contract.unitLabel}` : ''}
                    </p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField label="Amount" value={formatInvoiceMoney(invoice.amount, invoice.currency)} />
                    <DetailField label="Due date" value={formatInvoiceDate(invoice.dueDate)} />
                    <DetailField
                        label="Payment method"
                        value={invoice.paymentMethod === 'MOBILE' ? 'Online' : invoice.paymentMethod}
                    />
                    <DetailField label="Source" value={invoice.source} />
                    {invoice.paymentReference ? (
                        <DetailField label="Control number" value={invoice.paymentReference} />
                    ) : null}
                    {invoice.gatewayPaidAmount != null && invoice.gatewayPaidAmount > 0 ? (
                        <DetailField
                            label="Gateway paid"
                            value={formatInvoiceMoney(invoice.gatewayPaidAmount, invoice.currency)}
                        />
                    ) : null}
                    {invoice.paidAt ? (
                        <DetailField label="Paid at" value={formatInvoiceDate(invoice.paidAt)} />
                    ) : null}
                    <DetailField label="Billing period" value={`#${invoice.periodIndex + 1}`} />
                </div>
                {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
            </CardContent>
        </Card>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
