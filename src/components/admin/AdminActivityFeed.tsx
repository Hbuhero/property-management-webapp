import { InvoiceListPagination } from '@/components/invoices/InvoiceListPagination';
import type { AdminActivityEvent } from '@/schemas/adminReport.schema';

const categoryColor: Record<string, string> = {
    User: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Property: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Application: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Lease: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Invoice: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

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

function totalPagesFromMeta(pageCount: string | undefined): number {
    const raw = Number(pageCount ?? '0');
    if (!Number.isFinite(raw)) return 1;
    return Math.max(1, raw + 1);
}

type AdminActivityFeedProps = {
    events: AdminActivityEvent[];
    isLoading: boolean;
    emptyMessage: string;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    paginationDisabled?: boolean;
};

export function AdminActivityFeed({
    events,
    isLoading,
    emptyMessage,
    page,
    totalPages,
    onPageChange,
    paginationDisabled,
}: AdminActivityFeedProps) {
    return (
        <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                    <div className="p-6 text-sm text-slate-500">Loading activity…</div>
                ) : events.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">{emptyMessage}</div>
                ) : (
                    events.map((event, index) => (
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
            <div className="border-t border-slate-100 px-6 py-3 dark:border-slate-800">
                <InvoiceListPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    disabled={paginationDisabled || isLoading}
                />
            </div>
        </>
    );
}

export { totalPagesFromMeta };
