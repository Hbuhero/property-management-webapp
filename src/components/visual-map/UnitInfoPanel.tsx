import { MapPin } from 'lucide-react';
import type { UnitMapUnitDto } from '@/lib/contracts/preVisualMapContracts';

export type UnitInfoPanelProps = {
    unit: UnitMapUnitDto | null;
    floorLabel: string;
    onEnquire?: () => void;
};

function formatMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
    }).format(n);
}

/**
 * Side panel for the selected unit (public map — read-only + CTA).
 */
export function UnitInfoPanel({ unit, floorLabel, onEnquire }: UnitInfoPanelProps) {
    if (!unit) {
        return (
            <aside
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                aria-label="Unit details"
            >
                <p className="text-slate-500 text-sm leading-relaxed">
                    Select an <strong className="text-slate-700">available</strong> unit on the map
                    to see details. Occupied units are shown for orientation only.
                </p>
                <p className="mt-4 text-xs text-slate-400">{floorLabel}</p>
            </aside>
        );
    }

    const available = unit.status === 'AVAILABLE';

    return (
        <aside
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            aria-label={`Unit ${unit.unitNumber} details`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Unit {unit.unitNumber}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                        {floorLabel}
                    </p>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                    }`}
                >
                    {available ? 'Available' : 'Occupied'}
                </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-slate-500">Bedrooms</dt>
                    <dd className="font-medium text-slate-900">{unit.bedrooms ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-slate-500">Size</dt>
                    <dd className="font-medium text-slate-900">
                        {unit.sizeM2 != null ? `${unit.sizeM2} m²` : '—'}
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-slate-500">Monthly rent</dt>
                    <dd className="font-medium text-slate-900">{formatMoney(unit.monthlyRent)}</dd>
                </div>
            </dl>

            {available && onEnquire && (
                <button
                    type="button"
                    className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    onClick={onEnquire}
                >
                    Enquire about this unit
                </button>
            )}

            {!available && (
                <p className="mt-6 text-sm text-slate-500">This unit is not available to select.</p>
            )}
        </aside>
    );
}
