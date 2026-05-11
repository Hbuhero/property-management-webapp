import type { FloorMapDto } from '@/lib/contracts/preVisualMapContracts';
import { MapLegend } from '@/components/visual-map/MapLegend';
import { UnitOverlay } from '@/components/visual-map/UnitOverlay';

export type FloorMapProps = {
    data: FloorMapDto;
    imageSrc: string | null;
    selectedUnitId: number | null;
    onSelectUnit: (unitId: number | null) => void;
};

/**
 * Responsive floor plan image with percentage-based unit overlays.
 */
export function FloorMap({ data, imageSrc, selectedUnitId, onSelectUnit }: FloorMapProps) {
    return (
        <section aria-label="Floor map" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Interactive map</h2>
                <MapLegend />
            </div>

            {!imageSrc ? (
                <div
                    className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center"
                    role="status"
                >
                    <p className="max-w-md text-slate-600">
                        No floor plan image has been published for this floor yet. Unit list and
                        details may still appear in other views once data exists.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    <div className="relative w-full">
                        <img
                            src={imageSrc}
                            alt={`Floor plan for ${data.floorLabel}`}
                            className="block h-auto w-full"
                            decoding="async"
                            loading="lazy"
                        />
                        <div
                            className="absolute inset-0"
                            role="presentation"
                            aria-hidden={data.units.length === 0}
                        >
                            {data.units.map((u) => (
                                <UnitOverlay
                                    key={u.unitId}
                                    unit={u}
                                    selected={selectedUnitId === u.unitId}
                                    onSelect={(id) =>
                                        onSelectUnit(selectedUnitId === id ? null : id)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
