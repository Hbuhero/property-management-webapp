import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { formatMaintenanceCategory } from '@/components/maintenance/maintenanceLabels';
import { useAppSelector } from '@/hooks/useAppStore';
import { earliestInvoiceDueDate, sumPendingInvoiceAmount } from '@/lib/tenantBilling';
import { useInvoices } from '@/queries/invoice.queries';
import { useLeaseContracts } from '@/queries/leaseContract.queries';
import { useMaintenanceRequests } from '@/queries/maintenance.queries';
import type { MaintenanceRequest, MaintenanceStatus } from '@/schemas/maintenance.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`} />
);

function formatShortDate(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

function greetingName(fullName: string | undefined): string {
    const trimmed = fullName?.trim();
    if (!trimmed) return 'there';
    return trimmed.split(/\s+/)[0] ?? trimmed;
}

function dueInLabel(dueDate: string | undefined): string {
    if (!dueDate) return 'No outstanding invoices';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate.length === 10 ? `${dueDate}T00:00:00` : dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
}

function leaseProgress(startDate: string, endDate: string): { percent: number; label: string } {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const now = new Date();
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    const percent = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;

    const totalMonths = Math.max(
        1,
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()),
    );
    const elapsedMonths = Math.min(
        totalMonths,
        Math.max(
            0,
            (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()),
        ),
    );

    return {
        percent,
        label: `${elapsedMonths} months / ${totalMonths} months`,
    };
}

function paymentMethodLabel(method: string): string {
    return method === 'MOBILE' ? 'M-Pesa' : method === 'CASH' ? 'Cash' : method;
}

function isOpenStatus(status: MaintenanceStatus): boolean {
    return status !== 'RESOLVED' && status !== 'CLOSED';
}

function timelineDotClass(status: MaintenanceStatus): string {
    if (status === 'RESOLVED' || status === 'CLOSED') return 'bg-emerald-500';
    if (status === 'IN_PROGRESS' || status === 'UNDER_REVIEW') return 'bg-amber-500';
    return 'bg-blue-500';
}

function timelineLabel(request: MaintenanceRequest): string {
    const date = request.resolvedAt ?? request.updatedAt ?? request.createdAt;
    if (request.status === 'RESOLVED' || request.status === 'CLOSED') {
        return `Resolved ${formatShortDate(date)}`;
    }
    return `Updated ${formatShortDate(date)}`;
}

const TenantOverview = () => {
    const user = useAppSelector((s) => s.auth.user);
    const maintenanceQuery = useMaintenanceRequests();
    const pendingQuery = useInvoices({ status: 'PENDING' });
    const paidQuery = useInvoices({ status: 'PAID' });
    const contractsQuery = useLeaseContracts();

    const activeContract = useMemo(
        () => (contractsQuery.data ?? []).find((contract) => contract.status === 'ACCEPTED'),
        [contractsQuery.data],
    );

    const pending = pendingQuery.data ?? [];
    const balanceDue = sumPendingInvoiceAmount(pending);
    const nextDue = earliestInvoiceDueDate(pending);
    const currency = pending[0]?.currency ?? 'TZS';

    const recentPayments = useMemo(
        () =>
            [...(paidQuery.data ?? [])]
                .sort((a, b) => {
                    const aDate = a.paidAt ?? a.dueDate;
                    const bDate = b.paidAt ?? b.dueDate;
                    return bDate.localeCompare(aDate);
                })
                .slice(0, 3),
        [paidQuery.data],
    );

    const leaseMeta = activeContract
        ? leaseProgress(activeContract.startDate, activeContract.endDate)
        : null;

    const requests = maintenanceQuery.data ?? [];
    const openRequests = requests.filter((request) => isOpenStatus(request.status));
    const latestOpen = openRequests[0];
    const timelineItems = [...requests]
        .sort((a, b) => {
            const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
            const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
            return bTime - aTime;
        })
        .slice(0, 5);

    const billingLoading = pendingQuery.isLoading || contractsQuery.isLoading;

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Habari, {greetingName(user?.name)}!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    Here&apos;s your tenancy at a glance
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {billingLoading ? (
                    <Skeleton className="h-36" />
                ) : (
                    <motion.div
                        {...fadeUp}
                        {...stagger(0)}
                        className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20"
                    >
                        <p className="text-emerald-100 text-sm mb-1">Balance due</p>
                        <h2 className="text-3xl font-bold mb-4">
                            {formatInvoiceMoney(balanceDue, currency)}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit">
                            <Clock className="h-3.5 w-3.5" />
                            {dueInLabel(nextDue)}
                        </div>
                        <Link
                            to="/tenant/payments"
                            className="inline-block mt-3 text-xs font-semibold text-emerald-100 hover:text-white"
                        >
                            Go to payments →
                        </Link>
                    </motion.div>
                )}

                {contractsQuery.isLoading ? (
                    <Skeleton className="h-36" />
                ) : activeContract ? (
                    <motion.div
                        {...fadeUp}
                        {...stagger(1)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                    >
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Active lease</p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-1">
                            {activeContract.property.title}
                        </h2>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mb-2">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${leaseMeta?.percent ?? 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400">{leaseMeta?.label}</p>
                        <Link
                            to="/tenant/lease"
                            className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            View lease →
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        {...fadeUp}
                        {...stagger(1)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl"
                    >
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Active lease</p>
                        <p className="text-sm text-slate-500 mt-2">No accepted lease yet.</p>
                        <Link
                            to="/tenant/lease"
                            className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            View applications →
                        </Link>
                    </motion.div>
                )}

                {maintenanceQuery.isLoading ? (
                    <Skeleton className="h-36" />
                ) : (
                    <motion.div
                        {...fadeUp}
                        {...stagger(2)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                    >
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Open tickets</p>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            {openRequests.length}{' '}
                            <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                                open
                            </span>
                        </h2>
                        {latestOpen ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="line-clamp-1">{latestOpen.title}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No open maintenance requests</p>
                        )}
                        <Link
                            to="/tenant/maintenance"
                            className="inline-block mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            View maintenance portal →
                        </Link>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    {...fadeUp}
                    {...stagger(3)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Recent payments</h3>
                        <Link
                            to="/tenant/payments"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            View all
                        </Link>
                    </div>

                    {paidQuery.isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16" />
                            <Skeleton className="h-16" />
                        </div>
                    ) : paidQuery.isError ? (
                        <p className="text-sm text-red-600">
                            {paidQuery.error instanceof Error
                                ? paidQuery.error.message
                                : 'Could not load payments.'}
                        </p>
                    ) : recentPayments.length === 0 ? (
                        <p className="text-sm text-slate-500">No paid invoices yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentPayments.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                {invoice.item?.label ?? invoice.contract?.propertyTitle ?? 'Payment'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Paid via {paymentMethodLabel(invoice.paymentMethod)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatInvoiceMoney(invoice.amount, invoice.currency)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatInvoiceDate(invoice.paidAt ?? invoice.dueDate)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    {...fadeUp}
                    {...stagger(4)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Maintenance status</h3>
                        <Link
                            to="/tenant/maintenance"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            View all
                        </Link>
                    </div>

                    {maintenanceQuery.isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16" />
                            <Skeleton className="h-16" />
                        </div>
                    ) : maintenanceQuery.isError ? (
                        <p className="text-sm text-red-600">
                            {maintenanceQuery.error instanceof Error
                                ? maintenanceQuery.error.message
                                : 'Could not load maintenance requests.'}
                        </p>
                    ) : timelineItems.length === 0 ? (
                        <p className="text-sm text-slate-500">No maintenance requests yet.</p>
                    ) : (
                        <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                            {timelineItems.map((request) => (
                                <div key={request.id} className="relative">
                                    <div
                                        className={`absolute -left-[1.35rem] w-3 h-3 rounded-full ${timelineDotClass(request.status)} border-2 border-white dark:border-slate-900`}
                                    />
                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {request.title}
                                        </p>
                                        <MaintenanceStatusBadge status={request.status} />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {formatMaintenanceCategory(request.category)} · {timelineLabel(request)}
                                    </p>
                                    {request.resolutionNotes && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                                            {request.resolutionNotes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default TenantOverview;
