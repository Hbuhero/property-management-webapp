import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarClock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { OwnerFinancesNav } from '@/components/invoices/OwnerFinancesNav';
import { buildLeaseBillingSummaries } from '@/lib/invoiceAnalytics';
import { useInvoices } from '@/queries/invoice.queries';
import { useLeaseContracts } from '@/queries/leaseContract.queries';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const ActiveLeases = () => {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const contractsQuery = useLeaseContracts();
    const invoicesQuery = useInvoices();

    const summaries = useMemo(() => {
        const contracts = contractsQuery.data ?? [];
        const invoices = invoicesQuery.data ?? [];
        return buildLeaseBillingSummaries(contracts, invoices);
    }, [contractsQuery.data, invoicesQuery.data]);

    const isLoading = contractsQuery.isPending || invoicesQuery.isPending;
    const currency = invoicesQuery.data?.[0]?.currency ?? 'TZS';

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active leases</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Accepted contracts with billing status and upcoming dues.
                    </p>
                </div>
                <OwnerFinancesNav />
            </div>

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                    <p className="font-semibold text-slate-950 dark:text-white">
                        {summaries.length} active {summaries.length === 1 ? 'lease' : 'leases'}
                    </p>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Property / unit</TableHead>
                            <TableHead>Outstanding</TableHead>
                            <TableHead>Collected</TableHead>
                            <TableHead>Next due</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
                                </TableCell>
                            </TableRow>
                        ) : summaries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-28 text-center text-slate-500">
                                    No accepted lease contracts yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            summaries.map((row) => {
                                const contract = row.contract;
                                return (
                                    <TableRow key={contract.id}>
                                        <TableCell className="font-medium text-slate-900 dark:text-white">
                                            {contract.tenant?.name ?? 'Tenant'}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{contract.property.title}</p>
                                            <p className="text-xs text-slate-500">
                                                {contract.unit?.unitNumber
                                                    ? `Unit ${contract.unit.unitNumber}`
                                                    : '—'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-amber-700 dark:text-amber-300">
                                                {formatInvoiceMoney(row.pendingAmount, currency)}
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                {row.pendingCount} pending
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                                {formatInvoiceMoney(row.paidAmount, currency)}
                                            </span>
                                            <p className="text-xs text-slate-500">{row.paidCount} paid</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 text-sm">
                                                <CalendarClock className="h-4 w-4 text-slate-400" />
                                                {row.nextDue ? formatInvoiceDate(row.nextDue) : '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button type="button" size="sm" variant="outline" asChild>
                                                <Link
                                                    to={`${base}/finances?leaseContractId=${contract.id}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Billing
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </section>
        </motion.div>
    );
};

export default ActiveLeases;
