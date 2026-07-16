import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Building2, FileText, Users, Wrench, CreditCard, ClipboardList } from 'lucide-react';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { FormSelect } from '@/components/ui/form-select';
import {
    useAdminReportSummary,
    useDownloadAdminActivityPdf,
    useDownloadAdminInvoicesPdf,
    useDownloadAdminSystemOverviewPdf,
    useDownloadAdminUsersPdf,
} from '@/queries/adminReport.queries';
import type { AdminReportFilters } from '@/schemas/adminReport.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

function defaultDateRange(): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

function formatWhen(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

const categoryColor: Record<string, string> = {
    User: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Property: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Application: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Lease: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Invoice: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function AdminReports() {
    const initialRange = useMemo(() => defaultDateRange(), []);
    const [from, setFrom] = useState(initialRange.from);
    const [to, setTo] = useState(initialRange.to);
    const [invoiceStatus, setInvoiceStatus] = useState<string>('__all__');

    const filters: AdminReportFilters = useMemo(
        () => ({
            from,
            to,
            activityLimit: 50,
            status: invoiceStatus === '__all__' ? undefined : invoiceStatus,
        }),
        [from, to, invoiceStatus],
    );

    const { data: summary, isLoading, isError, error } = useAdminReportSummary(filters);
    const overviewPdf = useDownloadAdminSystemOverviewPdf();
    const usersPdf = useDownloadAdminUsersPdf();
    const activityPdf = useDownloadAdminActivityPdf();
    const invoicesPdf = useDownloadAdminInvoicesPdf();

    const statCards = summary
        ? [
              { label: 'Users', value: summary.totalUsers, sub: `${summary.activeUsers} active`, icon: Users },
              { label: 'Properties', value: summary.totalProperties, sub: 'Listed', icon: Building2 },
              { label: 'Invoices', value: summary.totalInvoices, sub: `${summary.pendingInvoices} pending`, icon: CreditCard },
              { label: 'Applications', value: summary.totalApplications, sub: `${summary.pendingApplications} pending`, icon: ClipboardList },
              { label: 'Maintenance', value: summary.totalMaintenance, sub: `${summary.openMaintenance} open`, icon: Wrench },
              { label: 'Leases', value: summary.totalLeases, sub: `${summary.activeLeases} accepted`, icon: FileText },
          ]
        : [];

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Generate PDF reports on platform activity and system information.
                    </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">From</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">To</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </label>
                </div>
            </div>

            {isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    {error instanceof Error ? error.message : 'Failed to load report summary'}
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
                      ))
                    : statCards.map((card) => {
                          const Icon = card.icon;
                          return (
                              <div
                                  key={card.label}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                              >
                                  <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                      <Icon className="h-4 w-4" aria-hidden />
                                      <span className="text-xs font-medium">{card.label}</span>
                                  </div>
                                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                  <p className="text-xs text-slate-400">{card.sub}</p>
                              </div>
                          );
                      })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <ReportCard
                    title="System overview"
                    description="Platform totals and recent activity snapshot."
                    onDownload={() => overviewPdf.mutateAsync(filters)}
                    isLoading={overviewPdf.isPending}
                />
                <ReportCard
                    title="User registrations"
                    description="Accounts created in the selected date range."
                    onDownload={() => usersPdf.mutateAsync(filters)}
                    isLoading={usersPdf.isPending}
                />
                <ReportCard
                    title="System activity"
                    description="Users, applications, payments, maintenance, and listings."
                    onDownload={() => activityPdf.mutateAsync(filters)}
                    isLoading={activityPdf.isPending}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Invoices</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        All invoices with due dates in the selected range.
                    </p>
                    <div className="mt-4 space-y-3">
                        <FormSelect
                            value={invoiceStatus}
                            onValueChange={setInvoiceStatus}
                            triggerClassName="w-full"
                            options={[
                                { value: '__all__', label: 'All statuses' },
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'PAID', label: 'Paid' },
                                { value: 'CANCELLED', label: 'Cancelled' },
                            ]}
                        />
                        <DownloadReportButton
                            onDownload={() => invoicesPdf.mutateAsync(filters)}
                            isLoading={invoicesPdf.isPending}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <Activity className="h-4 w-4 text-slate-400" aria-hidden />
                    <h2 className="font-semibold text-slate-900 dark:text-white">Recent activity</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading ? (
                        <div className="p-6 text-sm text-slate-500">Loading activity…</div>
                    ) : summary?.recentActivity.length === 0 ? (
                        <div className="p-6 text-sm text-slate-500">No activity in this period.</div>
                    ) : (
                        summary?.recentActivity.map((event, index) => (
                            <div
                                key={`${event.occurredAt}-${event.summary}-${index}`}
                                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                categoryColor[event.category] ??
                                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {event.category}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {event.summary}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        {event.actor} · {event.detail}
                                    </p>
                                </div>
                                <time className="shrink-0 text-xs text-slate-400">{formatWhen(event.occurredAt)}</time>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function ReportCard({
    title,
    description,
    onDownload,
    isLoading,
}: {
    title: string;
    description: string;
    onDownload: () => Promise<void>;
    isLoading: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            <DownloadReportButton
                onDownload={onDownload}
                isLoading={isLoading}
                className="mt-4 w-full"
            />
        </div>
    );
}
