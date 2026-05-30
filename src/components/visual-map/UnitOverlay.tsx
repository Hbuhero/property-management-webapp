import type { CSSProperties } from 'react';
import type { UnitMapUnitDto } from '@/lib/contracts/preVisualMapContracts';

export type UnitOverlayProps = {
    unit: UnitMapUnitDto;
    selected: boolean;
    onSelect: (unitId: number) => void;
};

/**
 * One unit rectangle in percentage space over the floor plan image.
 * Available units are clickable/focusable; occupied are inert.
 */
export function UnitOverlay({ unit, selected, onSelect }: UnitOverlayProps) {
    const isAvailable = unit.status === 'AVAILABLE';
    const isBooked = unit.status === 'BOOKED';
    const style: CSSProperties = {
        left: `${unit.xPct}%`,
        top: `${unit.yPct}%`,
        width: `${unit.wPct}%`,
        height: `${unit.hPct}%`,
    };

    const baseRing =
        selected && isAvailable
            ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white/90'
            : isAvailable
              ? 'ring-1 ring-emerald-600/50 hover:ring-2 hover:ring-emerald-500'
              : isBooked
                ? 'ring-1 ring-amber-500/50'
                : 'ring-1 ring-slate-500/40';

    if (!isAvailable) {
        return (
            <div
                className={`pointer-events-none absolute rounded-md ${
                    isBooked ? 'bg-amber-500/25' : 'bg-slate-900/35'
                } ${baseRing}`}
                style={style}
                aria-hidden
            />
        );
    }

    const label = `Unit ${unit.unitNumber}, available`;

    return (
        <button
            type="button"
            className={`absolute rounded-md bg-emerald-500/20 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${baseRing}`}
            style={style}
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onSelect(unit.unitId)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(unit.unitId);
                }
            }}
        />
    );
}
