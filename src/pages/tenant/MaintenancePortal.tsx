import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateMaintenanceDialog } from '@/components/maintenance/CreateMaintenanceDialog';
import { MaintenanceCategoryLabel } from '@/components/maintenance/MaintenanceCategoryLabel';
import { MaintenancePriorityBadge } from '@/components/maintenance/MaintenancePriorityBadge';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { MaintenanceRequestDetailPanel } from '@/components/maintenance/MaintenanceRequestDetailPanel';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { Button } from '@/components/ui/button';
import { useMaintenanceRequests } from '@/queries/maintenance.queries';
import {
    useDownloadMaintenanceListPdf,
    useDownloadMaintenancePdf,
} from '@/queries/report.queries';
import type { MaintenanceRequest } from '@/schemas/maintenance.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

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

function isClosedStatus(status: MaintenanceRequest['status']): boolean {
    return status === 'RESOLVED' || status === 'CLOSED';
}

function MaintenanceRequestCard({
    request,
    expanded,
    onToggle,
    index,
}: {
    request: MaintenanceRequest;
    expanded: boolean;
    onToggle: () => void;
    index: number;
}) {
    const { t } = useTranslation();
    const downloadPdf = useDownloadMaintenancePdf();
    const closed = isClosedStatus(request.status);

    return (
        <motion.div
            {...fadeUp}
            {...stagger(index)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                    <div
                        className={`p-3 rounded-xl shrink-0 ${
                            closed
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}
                    >
                        <Wrench className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{request.title}</h4>
                            <MaintenancePriorityBadge priority={request.priority} />
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                            #{request.id} · {request.property.title} · Unit {request.unit.unitNumber} ·{' '}
                            {formatShortDate(request.createdAt)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <MaintenanceStatusBadge status={request.status} />
                            <MaintenanceCategoryLabel category={request.category} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <DownloadReportButton
                        size="sm"
                        label={t('reports.downloadMaintenance')}
                        isLoading={downloadPdf.isPending}
                        onDownload={() => downloadPdf.mutateAsync(request.id)}
                    />
                    <Button variant="ghost" size="icon" onClick={onToggle} aria-label={expanded ? 'Collapse' : 'Expand'}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <MaintenanceRequestDetailPanel requestId={request.id} />
                </div>
            )}
        </motion.div>
    );
}

const MaintenancePortal = () => {
    const { t } = useTranslation();
    const [createOpen, setCreateOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const { data: requests = [], isLoading, isError, error } = useMaintenanceRequests();
    const downloadList = useDownloadMaintenanceListPdf();

    return (
        <motion.div {...fadeUp} className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Portal</h1>
                <div className="flex flex-wrap items-center gap-2">
                    {requests.length > 0 ? (
                        <DownloadReportButton
                            label={t('reports.exportMaintenance')}
                            isLoading={downloadList.isPending}
                            onDownload={() => downloadList.mutateAsync(undefined)}
                        />
                    ) : null}
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                        onClick={() => setCreateOpen(true)}
                    >
                        New Request
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-16 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading requests…
                </div>
            )}

            {isError && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-sm text-red-700 dark:text-red-300">
                    {error instanceof Error ? error.message : 'Could not load maintenance requests.'}
                </div>
            )}

            {!isLoading && !isError && requests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
                    <Wrench className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium text-slate-900 dark:text-white">No maintenance requests yet</p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                        Submit a request for an issue in your leased unit.
                    </p>
                    <Button onClick={() => setCreateOpen(true)}>New Request</Button>
                </div>
            )}

            {!isLoading && !isError && requests.length > 0 && (
                <div className="grid gap-4">
                    {requests.map((request, i) => (
                        <MaintenanceRequestCard
                            key={request.id}
                            request={request}
                            index={i}
                            expanded={expandedId === request.id}
                            onToggle={() =>
                                setExpandedId((prev) => (prev === request.id ? null : request.id))
                            }
                        />
                    ))}
                </div>
            )}

            <CreateMaintenanceDialog open={createOpen} onOpenChange={setCreateOpen} />
        </motion.div>
    );
};

export default MaintenancePortal;
