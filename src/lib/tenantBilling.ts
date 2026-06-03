import { nextDueEntry, todayIso } from '@/lib/leaseSchedule';
import type { Invoice } from '@/schemas/invoice.schema';

export function sumPendingInvoiceAmount(invoices: Invoice[]): number {
    return invoices
        .filter((invoice) => invoice.status === 'PENDING')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
}

export function earliestInvoiceDueDate(invoices: Invoice[]): string | undefined {
    const pending = invoices
        .filter((invoice) => invoice.status === 'PENDING')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return pending[0]?.dueDate;
}

export function nextScheduleDueLabel(
    entries: Array<{ date: string }>,
    today: string = todayIso(),
): string | undefined {
    const next = nextDueEntry(
        entries.map((entry, index) => ({
            key: String(index),
            label: '',
            date: entry.date,
            amount: 0,
            periodIndex: index,
        })),
        today,
    );
    return next?.date;
}
