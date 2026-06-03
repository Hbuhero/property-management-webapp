import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoices: Invoice[];
    isLoading?: boolean;
    emptyMessage?: string;
    onSelect?: (invoice: Invoice) => void;
    selectedInvoiceId?: number;
    renderActions?: (invoice: Invoice) => ReactNode;
};

function contractLabel(invoice: Invoice): string {
    const contract = invoice.contract;
    if (!contract) return '-';
    const unit = contract.unitLabel ? `Unit ${contract.unitLabel}` : '';
    const property = contract.propertyTitle ?? 'Property';
    return unit ? `${property} · ${unit}` : property;
}

export function InvoiceListTable({
    invoices,
    isLoading = false,
    emptyMessage = 'No invoices found.',
    onSelect,
    selectedInvoiceId,
    renderActions,
}: Props) {
    const colCount = renderActions ? 7 : 6;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Due date</TableHead>
                    <TableHead>Property / unit</TableHead>
                    <TableHead>Line item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    {renderActions ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={colCount}>
                            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
                        </TableCell>
                    </TableRow>
                ) : invoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={colCount} className="h-28 text-center text-slate-500">
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                ) : (
                    invoices.map((invoice) => (
                        <TableRow
                            key={invoice.id}
                            className={cn(
                                onSelect && 'cursor-pointer',
                                selectedInvoiceId === invoice.id &&
                                    'bg-emerald-50/80 dark:bg-emerald-950/30',
                            )}
                            onClick={onSelect ? () => onSelect(invoice) : undefined}
                        >
                            <TableCell className="font-medium text-slate-900 dark:text-white">
                                {formatInvoiceDate(invoice.dueDate)}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                                {contractLabel(invoice)}
                            </TableCell>
                            <TableCell>{invoice.item?.label ?? '-'}</TableCell>
                            <TableCell className="font-semibold">
                                {formatInvoiceMoney(invoice.amount, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                                {invoice.paymentMethod}
                            </TableCell>
                            <TableCell>
                                <InvoiceStatusBadge status={invoice.status} />
                            </TableCell>
                            {renderActions ? (
                                <TableCell
                                    className="text-right"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {renderActions(invoice)}
                                </TableCell>
                            ) : null}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
