import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantActiveTenancyPanel } from '@/components/invoices/TenantActiveTenancyPanel';
import { RequestInvoiceDialog } from '@/components/invoices/RequestInvoiceDialog';
import {
    CheckCircle2,
    ChevronDown,
    Eye,
    FileText,
    MoreHorizontal,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { showError, showSuccess } from '@/lib/toast';
import { useApplications, useWithdrawApplication } from '@/queries/application.queries';
import { useLeaseContracts } from '@/queries/leaseContract.queries';
import type { ApplicationStatus, PropertyApplication } from '@/schemas/application.schema';
import type { LeaseContract } from '@/schemas/leaseContract.schema';

const FILTERS: Array<ApplicationStatus | 'ALL'> = [
    'ALL',
    'PENDING',
    'APPROVED',
    'CONTRACT_SENT',
    'CONTRACT_ACCEPTED',
    'REJECTED',
    'CONTRACT_REJECTED',
    'WITHDRAWN',
];

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

function formatMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
    }).format(n);
}

function compactMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(n);
}

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

function statusLabel(status: ApplicationStatus | 'ALL'): string {
    return status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ');
}

function statusPillClass(status: string): string {
    switch (status) {
        case 'PENDING':
        case 'DRAFT':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'APPROVED':
        case 'ACCEPTED':
        case 'CONTRACT_ACCEPTED':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'SENT':
        case 'CONTRACT_SENT':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
        case 'REJECTED':
        case 'CONTRACT_REJECTED':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case 'WITHDRAWN':
        case 'TERMINATED':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

function contractLabel(contract: LeaseContract | undefined): string {
    return contract ? contract.status.replace(/_/g, ' ') : 'No contract';
}

function applicantDataCount(raw: string | null | undefined): number {
    if (!raw?.trim()) return 0;
    try {
        const parsed = JSON.parse(raw) as {
            bookingRequirements?: Array<{ question?: string; answer?: string }>;
        };
        if (Array.isArray(parsed.bookingRequirements)) {
            return parsed.bookingRequirements.filter((item) => item.answer?.trim()).length;
        }
    } catch {
        return raw.split(/\r?\n/).filter((line) => line.trim()).length;
    }
    return 0;
}

function propertyInitials(app: PropertyApplication): string {
    const source = app.property.title.trim() || `Unit ${app.unit.unitNumber}`;
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function canWithdraw(app: PropertyApplication): boolean {
    return app.status === 'PENDING' || app.status === 'APPROVED';
}

const LeaseManagement = () => {
    const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
    const [requestInvoiceOpen, setRequestInvoiceOpen] = useState(false);
    const status = filter === 'ALL' ? undefined : filter;
    const appsQuery = useApplications(status);
    const contractsQuery = useLeaseContracts();
    const withdrawMut = useWithdrawApplication();
    const navigate = useNavigate();

    const contractById = useMemo(() => {
        const map = new Map<number, LeaseContract>();
        for (const contract of contractsQuery.data ?? []) {
            map.set(contract.id, contract);
        }
        return map;
    }, [contractsQuery.data]);

    const contractByApplicationId = useMemo(() => {
        const map = new Map<number, LeaseContract>();
        for (const contract of contractsQuery.data ?? []) {
            if (contract.applicationId != null) {
                map.set(contract.applicationId, contract);
            }
        }
        return map;
    }, [contractsQuery.data]);

    const rows = appsQuery.data ?? [];
    const contracts = contractsQuery.data ?? [];
    const activeContract = contracts.find((contract) => contract.status === 'ACCEPTED');
    const totalRent = rows.reduce((sum, app) => sum + (app.unit.monthlyRent ?? 0), 0);
    const pendingContractCount = contracts.filter((contract) => contract.status === 'SENT').length;

    const contractForApplication = (app: PropertyApplication) => {
        if (app.contractId != null) {
            const contract = contractById.get(app.contractId);
            if (contract) return contract;
        }
        return contractByApplicationId.get(app.id);
    };

    const viewApplication = (id: number, openContract = false) => {
        navigate(`/tenant/lease/${id}${openContract ? '?contract=1' : ''}`);
    };

    const handleWithdraw = async (app: PropertyApplication) => {
        const ok = window.confirm(`Withdraw your request for ${app.property.title}, Unit ${app.unit.unitNumber}?`);
        if (!ok) return;
        try {
            await withdrawMut.mutateAsync(app.id);
            showSuccess('Booking request withdrawn.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not withdraw request');
        }
    };

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-7xl space-y-6 pb-10">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <FileText className="h-3.5 w-3.5" />
                            Tenant lease desk
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                            Booking requests and contracts
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Track each request, open the application workspace, and review contract terms when an owner sends them.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
                        <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                            <p className="text-xs opacity-70">Visible rent</p>
                            <p className="mt-1 text-xl font-bold">TZS {compactMoney(totalRent)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Pending contracts</p>
                            <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                                {pendingContractCount}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Active lease</p>
                            <p className="mt-1 truncate text-xl font-bold text-slate-950 dark:text-white">
                                {activeContract ? activeContract.property.title : 'None'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {activeContract ? (
                <>
                    <TenantActiveTenancyPanel
                        contract={activeContract}
                        onRequestInvoice={() => setRequestInvoiceOpen(true)}
                    />
                    <RequestInvoiceDialog
                        leaseContractId={activeContract.id}
                        open={requestInvoiceOpen}
                        onOpenChange={setRequestInvoiceOpen}
                    />
                </>
            ) : null}

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <p className="font-semibold text-slate-950 dark:text-white">Applications</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {rows.length} visible {rows.length === 1 ? 'request' : 'requests'}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-fit">
                                {statusLabel(filter)}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filter status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {FILTERS.map((item) => (
                                <DropdownMenuItem key={item} onClick={() => setFilter(item)}>
                                    {statusLabel(item)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {appsQuery.isError ? (
                    <div className="p-6 text-sm text-red-600">
                        {appsQuery.error instanceof Error ? appsQuery.error.message : 'Could not load applications'}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
                                <TableHead>Application</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contract</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appsQuery.isPending ? (
                                [0, 1, 2].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}>
                                            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-28 text-center text-slate-500">
                                        No applications found for this filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((app) => {
                                    const contract = contractForApplication(app);
                                    const canReview = contract?.status === 'SENT';
                                    return (
                                        <TableRow key={app.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                                                        {propertyInitials(app)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-950 dark:text-white">
                                                            {app.property.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Application #{app.id}
                                                            {applicantDataCount(app.applicantData) > 0
                                                                ? ` · ${applicantDataCount(app.applicantData)} answers`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    Unit {app.unit.unitNumber}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {app.unit.floorLabel ?? app.unit.unitType ?? 'Unit details pending'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatMoney(app.unit.monthlyRent)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusPillClass(app.status)}`}>
                                                    {app.status.replace(/_/g, ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusPillClass(contract?.status ?? 'NONE')}`}>
                                                    {contractLabel(contract)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {formatShortDate(app.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => viewApplication(app.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View
                                                    </Button>
                                                    {canReview ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => viewApplication(app.id, true)}
                                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Review
                                                        </Button>
                                                    ) : null}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button type="button" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Request actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                disabled={!canWithdraw(app) || withdrawMut.isPending}
                                                                onClick={() => void handleWithdraw(app)}
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Withdraw
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </section>
        </motion.div>
    );
};

export default LeaseManagement;
