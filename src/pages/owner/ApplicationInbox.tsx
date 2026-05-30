import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ChevronDown,
    Eye,
    FileText,
    MoreHorizontal,
    Trash2,
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
import {
    useApplications,
    useDeleteApplication,
} from '@/queries/application.queries';
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

function initials(name: string | null | undefined, email: string | null | undefined): string {
    const source = name?.trim() || email?.trim() || 'Tenant';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
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

function statusLabel(status: ApplicationStatus | 'ALL'): string {
    return status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ');
}

function statusPillClass(status: ApplicationStatus): string {
    switch (status) {
        case 'PENDING':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'APPROVED':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'CONTRACT_SENT':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
        case 'CONTRACT_ACCEPTED':
            return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
        case 'REJECTED':
        case 'CONTRACT_REJECTED':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

function contractLabel(contract: LeaseContract | undefined): string {
    return contract ? contract.status : 'No contract';
}

const ApplicationInbox = () => {
    const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
    const status = filter === 'ALL' ? undefined : filter;
    const appsQuery = useApplications(status);
    const contractsQuery = useLeaseContracts();
    const deleteMut = useDeleteApplication();
    const navigate = useNavigate();
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';

    const contractById = useMemo(() => {
        const map = new Map<number, LeaseContract>();
        for (const c of contractsQuery.data ?? []) {
            map.set(c.id, c);
        }
        return map;
    }, [contractsQuery.data]);

    const rows = appsQuery.data ?? [];
    const totalRent = rows.reduce((sum, app) => sum + (app.unit.monthlyRent ?? 0), 0);
    const pendingCount = rows.filter((app) => app.status === 'PENDING').length;
    const contractCount = rows.filter((app) => app.contractId != null).length;

    const viewApplication = (id: number, openContract = false) => {
        navigate(`${base}/applications/${id}${openContract ? '?contract=1' : ''}`);
    };

    const handleDelete = async (app: PropertyApplication) => {
        const ok = window.confirm(`Delete application from ${app.tenant.name ?? app.tenant.email ?? 'this tenant'}?`);
        if (!ok) return;
        try {
            await deleteMut.mutateAsync(app.id);
            showSuccess('Application deleted.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not delete application');
        }
    };

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-7xl space-y-6 pb-10">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <FileText className="h-3.5 w-3.5" />
                            Owner applications
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                            Booking request table
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Scan application status, review applicant data, and move each request into a contract workspace.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
                        <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                            <p className="text-xs opacity-70">Pipeline</p>
                            <p className="mt-1 text-xl font-bold">TZS {compactMoney(totalRent)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Pending</p>
                            <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{pendingCount}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Contracts</p>
                            <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{contractCount}</p>
                        </div>
                    </div>
                </div>
            </section>

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
                                <TableHead>Applicant</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contract</TableHead>
                                <TableHead>Received</TableHead>
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
                                    const contract = app.contractId ? contractById.get(app.contractId) : undefined;
                                    return (
                                        <TableRow key={app.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                                                        {initials(app.tenant.name, app.tenant.email)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-950 dark:text-white">
                                                            {app.tenant.name ?? 'Tenant'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{app.tenant.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {app.property.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {app.unit.floorLabel ? `${app.unit.floorLabel} · ` : ''}
                                                    Unit {app.unit.unitNumber}
                                                    {applicantDataCount(app.applicantData) > 0
                                                        ? ` · ${applicantDataCount(app.applicantData)} answers`
                                                        : ''}
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
                                            <TableCell className="text-sm text-slate-500">
                                                {contractLabel(contract)}
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
                                                    {app.status === 'PENDING' ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => viewApplication(app.id, true)}
                                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Approve
                                                        </Button>
                                                    ) : null}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button type="button" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                disabled={deleteMut.isPending}
                                                                onClick={() => void handleDelete(app)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
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

export default ApplicationInbox;
