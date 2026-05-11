/**
 * Compact legend for available vs occupied units on the floor map.
 */
export function MapLegend() {
    return (
        <div
            className="flex flex-wrap items-center gap-4 text-sm text-slate-600"
            aria-label="Map legend"
        >
            <span className="inline-flex items-center gap-2">
                <span
                    className="h-3 w-6 rounded border-2 border-emerald-500/80 bg-emerald-400/25"
                    aria-hidden
                />
                Available
            </span>
            <span className="inline-flex items-center gap-2">
                <span
                    className="h-3 w-6 rounded border-2 border-slate-400/60 bg-slate-300/40"
                    aria-hidden
                />
                Occupied
            </span>
        </div>
    );
}
