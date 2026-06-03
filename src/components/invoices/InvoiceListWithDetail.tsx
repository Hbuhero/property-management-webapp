import { useMemo, useState, type ReactNode } from 'react';
import { InvoiceDetailCard } from '@/components/invoices/InvoiceDetailCard';
import { InvoiceListTable } from '@/components/invoices/InvoiceListTable';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoices: Invoice[];
    isLoading?: boolean;
    emptyMessage?: string;
    detailPlaceholder?: string;
    renderActions?: (invoice: Invoice) => ReactNode;
    renderDetailActions?: (invoice: Invoice) => ReactNode;
};

export function InvoiceListWithDetail({
    invoices,
    isLoading = false,
    emptyMessage = 'No invoices found.',
    detailPlaceholder = 'Select an invoice row to view details.',
    renderActions,
    renderDetailActions,
}: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selected = useMemo(() => {
        if (invoices.length === 0) return null;
        if (selectedId != null) {
            const match = invoices.find((invoice) => invoice.id === selectedId);
            if (match) return match;
        }
        return invoices[0];
    }, [invoices, selectedId]);

    return (
        <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <InvoiceListTable
                    invoices={invoices}
                    isLoading={isLoading}
                    emptyMessage={emptyMessage}
                    selectedInvoiceId={selected?.id}
                    onSelect={(invoice) => setSelectedId(invoice.id)}
                    renderActions={renderActions}
                />
            </div>
            <div className="lg:col-span-2">
                {selected ? (
                    <InvoiceDetailCard
                        invoice={selected}
                        actions={renderDetailActions?.(selected)}
                    />
                ) : (
                    <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                        {detailPlaceholder}
                    </div>
                )}
            </div>
        </div>
    );
}
