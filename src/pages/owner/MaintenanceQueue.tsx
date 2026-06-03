import { useMemo, useState } from 'react';
import { ChevronDown, Loader2, Pencil, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { MaintenanceCategoryLabel } from '@/components/maintenance/MaintenanceCategoryLabel';
import { MaintenancePriorityBadge } from '@/components/maintenance/MaintenancePriorityBadge';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import {
    MAINTENANCE_PRIORITIES,
    MAINTENANCE_STATUSES,
    formatMaintenancePriority,
    formatMaintenanceStatus,
} from '@/components/maintenance/maintenanceLabels';
import { UpdateMaintenanceDialog } from '@/components/maintenance/UpdateMaintenanceDialog';
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
import { useMaintenanceRequests } from '@/queries/maintenance.queries';
import type {
    MaintenanceListFilters,
    MaintenancePriority,
    MaintenanceStatus,
} from '@/schemas/maintenance.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

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

function isOpenStatus(status: MaintenanceStatus): boolean {
    return status !== 'CLOSED' && status !== 'RESOLVED';
}

const MaintenanceQueue = () => {
    const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'ALL'>('ALL');
    const [propertyFilter, setPropertyFilter] = useState<number | 'ALL'>('ALL');
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
    const [updateOpen, setUpdateOpen] = useState(false);

    const listFilters = useMemo<MaintenanceListFilters>(() => {
        const filters: MaintenanceListFilters = {};
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        if (priorityFilter !== 'ALL') filters.priority = priorityFilter;
        if (propertyFilter !== 'ALL') filters.propertyId = propertyFilter;
        return filters;
    }, [statusFilter, priorityFilter, propertyFilter]);

    const requestsQuery = useMaintenanceRequests(listFilters);
    const allRequestsQuery = useMaintenanceRequests();

    const rows = requestsQuery.data ?? [];
    const openCount = rows.filter((row) => isOpenStatus(row.status)).length;
    const urgentCount = rows.filter((row) => row.priority === 'URGENT').length;

    const propertyOptions = useMemo(() => {
        const map = new Map<number, string>();
        for (const row of allRequestsQuery.data ?? []) {
            map.set(row.property.id, row.property.title);
        }
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [allRequestsQuery.data]);

    const openUpdate = (requestId: number) => {
        setSelectedRequestId(requestId);
        setUpdateOpen(true);
    };

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-7xl space-y-6 pb-10">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <Wrench className="h-3.5 w-3.5" />
                            Owner maintenance
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                            Maintenance queue
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Review tenant requests, update status, and add resolution notes.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                        <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                            <p className="text-xs opacity-70">Open</p>
                            <p className="mt-1 text-xl font-bold">{openCount}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
                            <p className="text-xs text-slate-500">Urgent</p>
                            <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{urgentCount}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <p className="font-semibold text-slate-950 dark:text-white">Requests</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {rows.length} visible {rows.length === 1 ? 'request' : 'requests'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-fit">
                                    {statusFilter === 'ALL'
                                        ? 'All statuses'
                                        : formatMaintenanceStatus(statusFilter)}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>All statuses</DropdownMenuItem>
                                {MAINTENANCE_STATUSES.map((item) => (
                                    <DropdownMenuItem key={item} onClick={() => setStatusFilter(item)}>
                                        {formatMaintenanceStatus(item)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-fit">
                                    {priorityFilter === 'ALL'
                                        ? 'All priorities'
                                        : formatMaintenancePriority(priorityFilter)}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setPriorityFilter('ALL')}>
                                    All priorities
                                </DropdownMenuItem>
                                {MAINTENANCE_PRIORITIES.map((item) => (
                                    <DropdownMenuItem key={item} onClick={() => setPriorityFilter(item)}>
                                        {formatMaintenancePriority(item)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {propertyOptions.length > 1 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-fit">
                                        {propertyFilter === 'ALL'
                                            ? 'All properties'
                                            : propertyOptions.find(([id]) => id === propertyFilter)?.[1] ??
                                              'Property'}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Property</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPropertyFilter('ALL')}>
                                        All properties
                                    </DropdownMenuItem>
                                    {propertyOptions.map(([id, title]) => (
                                        <DropdownMenuItem key={id} onClick={() => setPropertyFilter(id)}>
                                            {title}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {requestsQuery.isError ? (
                    <div className="p-6 text-sm text-red-600">
                        {requestsQuery.error instanceof Error
                            ? requestsQuery.error.message
                            : 'Could not load maintenance requests'}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
                                <TableHead>Tenant</TableHead>
                                <TableHead>Property / Unit</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requestsQuery.isPending ? (
                                [0, 1, 2].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}>
                                            <div className="flex items-center gap-2 py-2 text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading…
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-28 text-center text-slate-500">
                                        No maintenance requests found for this filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((request) => (
                                    <TableRow key={request.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                                                    {initials(request.tenant.name, request.tenant.email)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-950 dark:text-white">
                                                        {request.tenant.name ?? 'Tenant'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{request.tenant.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {request.property.title}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {request.unit.floorLabel ? `${request.unit.floorLabel} · ` : ''}
                                                Unit {request.unit.unitNumber}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                                {request.title}
                                            </p>
                                            <MaintenanceCategoryLabel category={request.category} />
                                        </TableCell>
                                        <TableCell>
                                            <MaintenancePriorityBadge priority={request.priority} />
                                        </TableCell>
                                        <TableCell>
                                            <MaintenanceStatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {formatShortDate(request.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openUpdate(request.id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Update
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </section>

            <UpdateMaintenanceDialog
                requestId={selectedRequestId}
                open={updateOpen}
                onOpenChange={setUpdateOpen}
            />
        </motion.div>
    );
};

export default MaintenanceQueue;
