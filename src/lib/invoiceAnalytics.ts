import { buildScheduleEntries } from '@/lib/leaseSchedule';
import { earliestInvoiceDueDate, sumPendingInvoiceAmount } from '@/lib/tenantBilling';
import type { Invoice } from '@/schemas/invoice.schema';
import type { LeaseContract } from '@/schemas/leaseContract.schema';

export type RevenueChartPoint = {
    name: string;
    revenue: number;
};

export function invoicesForContract(invoices: Invoice[], contractId: number): Invoice[] {
    return invoices.filter((invoice) => invoice.contract?.id === contractId);
}

export function sumPaidInvoiceAmount(invoices: Invoice[]): number {
    return invoices
        .filter((invoice) => invoice.status === 'PAID')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
}

export function paidRevenueByMonth(invoices: Invoice[], monthCount = 6): RevenueChartPoint[] {
    const paid = invoices.filter((invoice) => invoice.status === 'PAID' && invoice.paidAt);
    const buckets = new Map<string, number>();

    for (const invoice of paid) {
        const monthKey = invoice.paidAt!.slice(0, 7);
        buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + invoice.amount);
    }

    const sortedKeys = [...buckets.keys()].sort().slice(-monthCount);
    return sortedKeys.map((key) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString(undefined, {
            month: 'short',
        });
        return { name: label, revenue: buckets.get(key) ?? 0 };
    });
}

export type LeaseBillingSummary = {
    contract: LeaseContract;
    pendingAmount: number;
    paidAmount: number;
    pendingCount: number;
    paidCount: number;
    nextDue?: string;
};

export function buildLeaseBillingSummaries(
    contracts: LeaseContract[],
    invoices: Invoice[],
): LeaseBillingSummary[] {
    return contracts
        .filter((contract) => contract.status === 'ACCEPTED')
        .map((contract) => {
            const contractInvoices = invoicesForContract(invoices, contract.id);
            const pending = contractInvoices.filter((invoice) => invoice.status === 'PENDING');
            const paid = contractInvoices.filter((invoice) => invoice.status === 'PAID');
            const billedKeys = new Set(
                contractInvoices
                    .filter((invoice) => invoice.status !== 'CANCELLED')
                    .map((invoice) => invoice.scheduleKey),
            );
            const scheduleNext = buildScheduleEntries(contract).find(
                (entry) => !billedKeys.has(entry.scheduleKey ?? ''),
            )?.date;

            return {
                contract,
                pendingAmount: sumPendingInvoiceAmount(contractInvoices),
                paidAmount: paid.reduce((sum, invoice) => sum + invoice.amount, 0),
                pendingCount: pending.length,
                paidCount: paid.length,
                nextDue: earliestInvoiceDueDate(contractInvoices) ?? scheduleNext,
            };
        })
        .sort((a, b) => {
            const aDate = a.nextDue ?? '9999-12-31';
            const bDate = b.nextDue ?? '9999-12-31';
            return aDate.localeCompare(bDate);
        });
}
