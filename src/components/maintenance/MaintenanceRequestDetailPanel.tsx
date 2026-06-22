import { Loader2 } from 'lucide-react';
import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { useMaintenanceRequest } from '@/queries/maintenance.queries';

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

type Props = {
    requestId: number;
};

export function MaintenanceRequestDetailPanel({ requestId }: Props) {
    const { data: request, isLoading, isError, error } = useMaintenanceRequest(requestId);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading details…
            </div>
        );
    }

    if (isError || !request) {
        return (
            <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : 'Could not load request details.'}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {request.description}
            </p>
            {request.resolutionNotes && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Resolution notes</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{request.resolutionNotes}</p>
                </div>
            )}
            {request.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {request.imageUrls.map((url) => {
                        const src = resolvePropertyImageUrl(url);
                        if (!src) return null;
                        return (
                            <a
                                key={url}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                className="block h-20 w-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            >
                                <img src={src} alt="" className="h-full w-full object-cover" />
                            </a>
                        );
                    })}
                </div>
            )}
            {request.resolvedAt && (
                <p className="text-xs text-slate-400">Resolved {formatShortDate(request.resolvedAt)}</p>
            )}
        </div>
    );
}
